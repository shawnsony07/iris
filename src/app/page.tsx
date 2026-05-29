"use client";

import { useEffect, useRef } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { KalmanFilter2D } from "@/utils/KalmanFilter2D";
import { useIrisStore } from "@/store/useIrisStore";
import { GridUI } from "@/components/GridUI";
import { CursorOverlay } from "@/components/CursorOverlay";
import { NodeBuilder } from "@/components/NodeBuilder";
import { SpeakHandler } from "@/components/SpeakHandler";

// Intercept and demote non-fatal MediaPipe WASM stderr logging to prevent Next.js Dev Error Overlay from popping up
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    if (
      msg.includes("XNNPACK") || 
      msg.includes("Xnnpack") || 
      msg.includes("OpenGL") || 
      msg.includes("blendshape") || 
      msg.includes("delegate") ||
      msg.includes("FaceBlendshapesGraph") ||
      msg.includes("vision_wasm")
    ) {
      console.warn("[MediaPipe Info Log]:", ...args);
      return;
    }
    originalError(...args);
  };
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to init camera or mediapipe", err);
      }
    };

    init();

    return () => {
      isActive = false;
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleVideoLoad = () => {
    let lastVideoTime = -1;
    const filter = new KalmanFilter2D(40, 0.05); 
    const { setCursor } = useIrisStore.getState();
    let animationFrameId: number;

    const detect = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && faceLandmarkerRef.current) {
        let startTimeMs = performance.now();
        if (videoRef.current.currentTime !== lastVideoTime) {
          lastVideoTime = videoRef.current.currentTime;
          try {
            const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
            
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              if (landmarks && landmarks.length > 468) {
                const iris = landmarks[468]; 
                const leftInner = landmarks[133];
                const leftOuter = landmarks[33];

                if (iris && leftInner && leftOuter) {
                  // 1. Establish static anchor (socket midpoint)
                  const midX = (leftInner.x + leftOuter.x) / 2;
                  const midY = (leftInner.y + leftOuter.y) / 2;
                  
                  // 2. Isolate gaze vector (displacement)
                  const dx = iris.x - midX;
                  const dy = iris.y - midY;

                  // 3. Apply sensitivity amplification (configurable)
                  const gainX = 30; // amplify horizontal movement
                  const gainY = 30; // amplify vertical movement

                  // 4. Normalize and Clamp to [0, 1] around a 0.5 center
                  // Inverting X so looking left moves left (adjusting for camera mirror)
                  const rawX = 0.5 - (dx * gainX);
                  const rawY = 0.5 + (dy * gainY);

                  const clampedX = Math.min(Math.max(rawX, 0.0), 1.0);
                  const clampedY = Math.min(Math.max(rawY, 0.0), 1.0);

                  const screenX = clampedX * window.innerWidth;
                  const screenY = clampedY * window.innerHeight;

                  const smoothed = filter.update(screenX, screenY);
                  setCursor(smoothed.x, smoothed.y);
                }
              }
            }
          } catch (detectErr) {
            console.error("MediaPipe detection loop error:", detectErr);
          }
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };
    detect();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onLoadedData={handleVideoLoad}
        className="fixed bottom-4 right-4 w-64 h-auto rounded-xl shadow-2xl border-2 border-slate-700 z-50 pointer-events-none opacity-70 [transform:scaleX(-1)]"
      />
      
      <NodeBuilder />
      
      <div className="flex-1 flex p-4 gap-4 z-10 relative">
        <div className="flex-[3]">
          <GridUI />
        </div>
        <div className="flex-1 flex items-center justify-center border-l-4 border-slate-800 pl-4">
          <SpeakHandler />
        </div>
      </div>

      <CursorOverlay />
    </main>
  );
}
