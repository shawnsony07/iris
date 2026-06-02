'use client';

import {
  useRef, useState, useEffect, useCallback, ReactNode, MutableRefObject,
} from 'react';
import { GazeContext, GazeState, GazePosition } from '@/lib/gazeContext';
import { estimateRawGaze } from '@/lib/gazeEstimator';
import { BlinkDetector }   from '@/lib/blinkDetector';
import { EMASmooth }       from '@/lib/emaSmooth';
import { CalibrationManager, CALIBRATION_TARGETS } from '@/lib/calibration';

const WASM_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

interface ReactiveState {
  blinkCount: number;
  isFaceDetected: boolean;
  isCalibrated: boolean;
  isTracking: boolean;
  isCalibrating: boolean;
  calibrationStep: number;
  initStatus: GazeState['initStatus'];
  errorMessage: string;
  isWebGPU: boolean;
  stream: MediaStream | null;
}

export function GazeProvider({ children, autoStart = false }: { children: ReactNode, autoStart?: boolean }) {
  // ── Refs (updated every frame, no re-render cost) ──────────────────────────
  const videoRef        = useRef<HTMLVideoElement>(null);
  const landmarkerRef   = useRef<unknown>(null);
  const animFrameRef    = useRef<number>(0);
  const lastTimeRef     = useRef<number>(-1);
  const lastPerfTimeRef = useRef<number>(-1);
  const smootherRef     = useRef(new EMASmooth(0.12));
  const calibrationRef  = useRef(new CalibrationManager());
  const blinkDetRef     = useRef<BlinkDetector | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const blinkCountRef   = useRef(0);

  const gazePositionRef = useRef<GazePosition>({ x: 0, y: 0 }) as MutableRefObject<GazePosition>;
  const rawIrisRef      = useRef<GazePosition>({ x: 0.5, y: 0.5 }) as MutableRefObject<GazePosition>;
  const hoverStateRef   = useRef({ isHovering: false, dwellPct: 0, snapTarget: undefined as GazePosition | undefined });

  // ── Reactive state (discrete events only — blinks, face loss, status) ──────
  const [rs, setRS] = useState<ReactiveState>({
    blinkCount: 0,
    isFaceDetected: false,
    isCalibrated: false,
    isTracking: false,
    isCalibrating: false,
    calibrationStep: 0,
    initStatus: 'idle',
    errorMessage: '',
    isWebGPU: false,
    stream: null,
  });

  // ── Blink detector (created once) ──────────────────────────────────────────
  useEffect(() => {
    blinkDetRef.current = new BlinkDetector(() => {
      blinkCountRef.current += 1;
      const count = blinkCountRef.current;
      setRS(prev => ({ ...prev, blinkCount: count }));
    });
  }, []);

  // ── Detection loop ─────────────────────────────────────────────────────────
  const runLoop = useCallback(() => {
    const loop = () => {
      const video     = videoRef.current;
      const landmarker = landmarkerRef.current as { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks?: { x: number; y: number; z: number }[][] } } | null;

      if (!video || !landmarker || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (video.currentTime === lastTimeRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      lastTimeRef.current = video.currentTime;

      let now = performance.now();
      if (now <= lastPerfTimeRef.current) {
        now = lastPerfTimeRef.current + 1;
      }
      lastPerfTimeRef.current = now;

      const results = landmarker.detectForVideo(video, now);
      const faces   = results.faceLandmarks;

      if (faces && faces.length > 0) {
        const lm = faces[0];

        // Blink
        const isBlinking = blinkDetRef.current?.update(lm) ?? false;
        void isBlinking; // used inside BlinkDetector callback only

        // Gaze - Freeze coordinates while blinking to prevent downward spike
        if (!isBlinking) {
          const raw = estimateRawGaze(lm);
          if (raw) {
            rawIrisRef.current = raw;

            // Apply calibration (if ready) or direct screen mapping
            const calibrated = calibrationRef.current.apply(raw.x, raw.y);
            const screenPos  = calibrated ?? {
              x: raw.x * window.innerWidth,
              y: raw.y * window.innerHeight,
            };

            // EMA smooth
            const smoothed = smootherRef.current.update(screenPos.x, screenPos.y);

            // Clamp to viewport
            gazePositionRef.current = {
              x: Math.max(0, Math.min(window.innerWidth,  smoothed.x)),
              y: Math.max(0, Math.min(window.innerHeight, smoothed.y)),
            };
          }
        }

        setRS(prev =>
          prev.isFaceDetected ? prev : { ...prev, isFaceDetected: true }
        );
      } else {
        setRS(prev =>
          prev.isFaceDetected ? { ...prev, isFaceDetected: false } : prev
        );
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Camera init ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setRS(prev => ({ ...prev, initStatus: 'requesting-camera' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setRS(prev => ({ ...prev, isTracking: true, initStatus: 'ready', stream }));
        runLoop();
      };
    } catch (e) {
      setRS(prev => ({
        ...prev,
        initStatus: 'error',
        errorMessage: 'Camera access denied. Please allow camera permission and reload.',
      }));
    }
  }, [runLoop]);

  // ── MediaPipe init ─────────────────────────────────────────────────────────
  const initialize = useCallback(() => {
    if (rs.initStatus !== 'idle' && rs.initStatus !== 'error') return; // Already initializing/ready

    let cancelled = false;

    // Suppress Emscripten stderr INFO/WARN logs that Next.js intercepts and treats as Unhandled Errors
    const originalConsoleError = console.error;
    const isMediaPipeLog = (msg: any) => {
      if (typeof msg !== 'string') return false;
      // Match C++ logging format: W0601 09:31:54.825000 1880752 face_landmarker_graph.cc:180]
      if (/^[IWEF]\d{4} \d{2}:\d{2}:\d{2}\.\d{6}/.test(msg)) return true;
      if (msg.includes('TensorFlow Lite XNNPACK delegate')) return true;
      if (msg.includes('OpenGL error checking is disabled')) return true;
      if (msg.includes('xnnpack')) return true;
      return false;
    };
    console.error = (...args: any[]) => {
      if (isMediaPipeLog(args[0])) return;
      originalConsoleError.apply(console, args);
    };

    (async () => {
      setRS(prev => ({ ...prev, initStatus: 'loading-model' }));
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);

        const fl = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

        if (cancelled) { fl.close(); return; }

        landmarkerRef.current = fl;
        setRS(prev => ({ ...prev, isWebGPU: false }));
        await startCamera();
      } catch (e) {
        if (!cancelled) {
          setRS(prev => ({
            ...prev,
            initStatus: 'error',
            errorMessage: `Failed to load MediaPipe model: ${(e as Error).message}`,
          }));
        }
      }
    })();
    return () => {
      cancelled = true;
      console.error = originalConsoleError;
    };
  }, [rs.initStatus, startCamera]);

  useEffect(() => {
    if (autoStart) {
      initialize();
    }
  }, [autoStart, initialize]);

  // ── Calibration controls ───────────────────────────────────────────────────
  const startCalibration = useCallback(() => {
    calibrationRef.current.reset();
    smootherRef.current.reset();
    setRS(prev => ({
      ...prev,
      isCalibrating: true,
      calibrationStep: 0,
      isCalibrated: false,
    }));
  }, []);

  const recordCalibrationPoint = useCallback(() => {
    setRS(prev => {
      if (!prev.isCalibrating) return prev;

      const target     = CALIBRATION_TARGETS[prev.calibrationStep];
      const screenX    = target.x * window.innerWidth;
      const screenY    = target.y * window.innerHeight;
      const { x, y }  = rawIrisRef.current;

      calibrationRef.current.addSample({ screenX, screenY, irisX: x, irisY: y });

      const nextStep = prev.calibrationStep + 1;
      if (nextStep >= CALIBRATION_TARGETS.length) {
        return {
          ...prev,
          isCalibrating: false,
          calibrationStep: 0,
          isCalibrated: calibrationRef.current.isReady,
        };
      }
      return { ...prev, calibrationStep: nextStep };
    });
  }, []);

  const resetCalibration = useCallback(() => {
    calibrationRef.current.reset();
    setRS(prev => ({ ...prev, isCalibrated: false, isCalibrating: false, calibrationStep: 0 }));
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────
  const value: GazeState = {
    ...rs,
    gazePositionRef,
    rawIrisRef,
    hoverStateRef,
    initialize,
    startCalibration,
    recordCalibrationPoint,
    resetCalibration,
  };

  return (
    <GazeContext.Provider value={value}>
      <video
        ref={videoRef}
        style={{
          opacity: 0,
          pointerEvents: 'none',
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '640px',
          height: '480px',
        }}
        playsInline
        muted
        aria-hidden="true"
      />
      {children}
    </GazeContext.Provider>
  );
}
