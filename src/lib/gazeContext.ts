'use client';

import { createContext, useContext, MutableRefObject } from 'react';

export interface GazePosition {
  x: number;
  y: number;
}

export interface GazeState {
  // ── Reactive state (triggers re-renders only on discrete events) ──
  blinkCount: number;       // increments on every intentional blink
  isFaceDetected: boolean;
  isCalibrated: boolean;
  isTracking: boolean;      // camera running + MediaPipe ready
  isCalibrating: boolean;
  calibrationStep: number;  // 0-4 (5-point calibration)
  initStatus: 'idle' | 'loading-model' | 'requesting-camera' | 'ready' | 'error';
  errorMessage: string;
  isWebGPU: boolean;        // whether WebGPU delegate is active
  stream: MediaStream | null;

  // ── High-frequency refs (updated every frame, no React re-render) ──
  // Read these directly in RAF loops, not in render
  gazePositionRef: MutableRefObject<GazePosition>;
  rawIrisRef: MutableRefObject<GazePosition>;
  // Shared hover state: GazeButton writes, GazeCursor reads — zero React renders
  hoverStateRef: MutableRefObject<{ isHovering: boolean; dwellPct: number }>;

  // ── Methods ──
  startCalibration: () => void;
  recordCalibrationPoint: () => void; // called externally to capture current iris pos
  resetCalibration: () => void;
}

const noop = () => {};
const dummyRef  = { current: { x: 0, y: 0 } };
const dummyHover = { current: { isHovering: false, dwellPct: 0 } };

export const GazeContext = createContext<GazeState>({
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
  gazePositionRef:  dummyRef   as MutableRefObject<GazePosition>,
  rawIrisRef:       dummyRef   as MutableRefObject<GazePosition>,
  hoverStateRef:    dummyHover as MutableRefObject<{ isHovering: boolean; dwellPct: number }>,
  startCalibration: noop,
  recordCalibrationPoint: noop,
  resetCalibration: noop,
});

export function useGaze() {
  return useContext(GazeContext);
}
