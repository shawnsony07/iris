'use client';

import { useEffect, useRef, useState } from 'react';
import { useGaze } from '@/lib/gazeContext';
import { CALIBRATION_TARGETS } from '@/lib/calibration';

const DWELL_BEFORE_READY_MS = 1200; // settle time before the target becomes "ready to blink"

export function CalibrationOverlay() {
  const {
    isCalibrating,
    calibrationStep,
    blinkCount,
    recordCalibrationPoint,
    startCalibration,
    resetCalibration,
    isCalibrated,
  } = useGaze();

  const prevBlinkRef = useRef(blinkCount);
  const [ready, setReady]   = useState(false);   // target has settled — blink to confirm
  const [pulse, setPulse]   = useState(false);    // brief pulse on confirm
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reset "ready" state when the step changes
  useEffect(() => {
    setReady(false);
    clearTimeout(timerRef.current);
    if (isCalibrating) {
      timerRef.current = setTimeout(() => setReady(true), DWELL_BEFORE_READY_MS);
    }
  }, [calibrationStep, isCalibrating]);

  // Listen for blinks — only during calibration and when target is ready
  useEffect(() => {
    if (!isCalibrating || !ready) {
      prevBlinkRef.current = blinkCount;
      return;
    }
    if (blinkCount !== prevBlinkRef.current) {
      prevBlinkRef.current = blinkCount;
      setPulse(true);
      setTimeout(() => {
        setPulse(false);
        recordCalibrationPoint();
      }, 250);
    }
  }, [blinkCount, isCalibrating, ready, recordCalibrationPoint]);

  if (!isCalibrating) {
    return (
      <div style={{
        position: 'fixed', bottom: 24, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 800,
        display: 'flex', gap: 10,
      }}>
        <button
          className="ctrl-btn"
          onClick={startCalibration}
          style={ctrlStyle('#00d4ff')}
        >
          {isCalibrated ? '↺ Recalibrate' : '◎ Calibrate'}
        </button>
        {isCalibrated && (
          <button
            className="ctrl-btn"
            onClick={resetCalibration}
            style={ctrlStyle('rgba(255,100,100,0.8)')}
          >
            ✕ Reset
          </button>
        )}
      </div>
    );
  }

  const target    = CALIBRATION_TARGETS[calibrationStep];
  const total     = CALIBRATION_TARGETS.length;
  const targetX   = target.x * window.innerWidth;
  const targetY   = target.y * window.innerHeight;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(3, 9, 18, 0.94)',
      zIndex: 900,
      cursor: 'none',
    }}>
      {/* Instructions */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <p style={{ color: '#4a7d9a', fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          CALIBRATION · POINT {calibrationStep + 1} / {total}
        </p>
        <p style={{ color: '#e0f4ff', fontSize: 18, marginTop: 8 }}>
          {ready ? 'Blink to confirm' : 'Look at the target…'}
        </p>
      </div>

      {/* Progress dots */}
      <div style={{
        position: 'absolute', bottom: 36, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 10,
      }}>
        {CALIBRATION_TARGETS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < calibrationStep
                ? '#00ff87'
                : i === calibrationStep
                ? '#00d4ff'
                : 'rgba(255,255,255,0.15)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Target */}
      <div
        style={{
          position: 'absolute',
          left: targetX,
          top: targetY,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.5s cubic-bezier(.4,0,.2,1), top 0.5s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Outer pulsing ring */}
        <div style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          border: `1px solid rgba(0, 212, 255, ${ready ? 0.4 : 0.15})`,
          animation: ready ? 'calPulse 1.2s ease-in-out infinite' : 'none',
        }} />
        {/* Main circle */}
        <div style={{
          width: 28, height: 28,
          borderRadius: '50%',
          border: `2px solid ${pulse ? '#00ff87' : ready ? '#00d4ff' : 'rgba(0,212,255,0.5)'}`,
          background: pulse
            ? 'rgba(0,255,135,0.2)'
            : ready
            ? 'rgba(0,212,255,0.08)'
            : 'transparent',
          transition: 'border-color 0.2s, background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: pulse ? '#00ff87' : ready ? '#00d4ff' : 'rgba(0,212,255,0.4)',
          }} />
        </div>
      </div>
    </div>
  );
}

function ctrlStyle(color: string): React.CSSProperties {
  return {
    background: 'rgba(8, 18, 32, 0.95)',
    border: `1px solid ${color}`,
    color,
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.06em',
    cursor: 'none',
    outline: 'none',
  };
}
