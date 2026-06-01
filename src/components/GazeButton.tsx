"use client";

import { useIrisStore } from "@/store/useIrisStore";
import React, { useRef, useState, useEffect } from "react";
import { ttsService } from "@/utils/ttsService";
import { webLlmService } from "@/utils/webLlmService";
import { useGaze } from "@/lib/gazeContext";

const DWELL_VISUAL_MS = 1800; // visual feedback for dwell

interface GazeButtonProps {
  id: string;
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  customDwellTime?: number;
  "data-block-id"?: string;
  "data-disabled"?: boolean;
  colorClass?: string;
  accentColor?: string;
}

export function GazeButton({ 
  id, 
  text,
  icon: Icon,
  className = "", 
  customDwellTime = 600,
  "data-block-id": dataBlockId,
  "data-disabled": dataDisabled,
  colorClass = "",
  accentColor,
}: GazeButtonProps) {
  const { isDebugMode } = useIrisStore();
  const { gazePositionRef, blinkCount, isCalibrating, hoverStateRef } = useGaze();

  const btnRef        = useRef<HTMLDivElement>(null);
  const dwellRingRef  = useRef<SVGCircleElement>(null);
  const wasHoveredRef = useRef(false);
  const dwellStartRef = useRef(0);
  const prevBlinkRef  = useRef(blinkCount);
  const rafRef        = useRef<number>(0);

  const [isHovered, setIsHovered] = useState(false);
  const [justSelected, setJustSelected] = useState(false);

  // RAF: bounds checking + dwell ring update (no cross-component setState)
  useEffect(() => {
    const CIRC = 2 * Math.PI * 14;

    const tick = () => {
      if (btnRef.current && !dataDisabled) {
        const { x, y } = gazePositionRef.current;
        const r   = btnRef.current.getBoundingClientRect();
        const hit = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        const was = wasHoveredRef.current;

        if (hit !== was) {
          wasHoveredRef.current = hit;
          setIsHovered(hit);

          if (hit) {
            dwellStartRef.current = performance.now();
            hoverStateRef.current = { isHovering: true, dwellPct: 0 };
          } else {
            // Clear ring
            if (dwellRingRef.current) {
              dwellRingRef.current.style.strokeDashoffset = String(CIRC);
            }
            if (hoverStateRef.current.isHovering) {
              hoverStateRef.current = { isHovering: false, dwellPct: 0 };
            }
          }
        }

        // While hovering: update dwell ring directly
        if (hit && dwellRingRef.current) {
          const pct = Math.min(1, (performance.now() - dwellStartRef.current) / DWELL_VISUAL_MS);
          const offset = CIRC * (1 - pct);
          dwellRingRef.current.style.strokeDashoffset = String(offset);
          hoverStateRef.current = { isHovering: true, dwellPct: pct };
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (wasHoveredRef.current && hoverStateRef.current.isHovering) {
        hoverStateRef.current = { isHovering: false, dwellPct: 0 };
      }
    };
  }, [gazePositionRef, hoverStateRef, dataDisabled]);

  const triggerAction = () => {
    const state = useIrisStore.getState();

    if (id === "wake-block") {
      state.setSleepMode(false);
    } else if (id === "close-modal") {
      state.setShowMediaModal(false);
    } else if (id === "speak-block") {
      document.getElementById("speak-block")?.dispatchEvent(new CustomEvent('dwell-click'));
    } else if (id.startsWith("tone-block-")) {
      const tone = id.replace("tone-block-", "");
      state.setActiveTone(state.activeTone === tone ? null : tone);
    } else if (id === "grid-block-Adjust") {
      // No-op for now
    } else {
      const nodeVal = dataBlockId || id.replace("grid-block-", "");
      if (nodeVal === "EMERGENCY") {
        fetch('/api/twilio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: '+1234567890', message: 'Emergency alert triggered.' })
        }).catch(console.error);
        return;
      }
      
      if (state.isContextResponse && id.startsWith("pred-")) {
        ttsService.speak(nodeVal);
        state.setIsContextResponse(false);
        state.setPredictions([]);
        state.setAmbientContext("");
      } else if (nodeVal === "Sleep Mode") {
        state.setSleepMode(true);
      } else if (nodeVal === "Re-Optimize Layout") {
        state.reoptimizeLayout();
      } else if (nodeVal === "Music" && state.selectedNodes.includes("Entertainment")) {
        state.setShowMediaModal(true);
        state.clearNodes();
      } else {
        state.addNode(nodeVal);
        state.incrementFrequency(nodeVal);
        webLlmService.predictNextWords(state.selectedNodes);
      }
    }
  };

  // Blink-to-select logic
  useEffect(() => {
    if (isCalibrating) {
      prevBlinkRef.current = blinkCount;
      return;
    }
    if (blinkCount !== prevBlinkRef.current) {
      prevBlinkRef.current = blinkCount;
      if (isHovered && !dataDisabled) {
        triggerAction();
        setJustSelected(true);
        setTimeout(() => setJustSelected(false), 600);
      }
    }
  }, [blinkCount, isHovered, isCalibrating, dataDisabled]);

  const handleClick = () => {
    if (isDebugMode && !dataDisabled) {
      triggerAction();
      setJustSelected(true);
      setTimeout(() => setJustSelected(false), 600);
    }
  };

  const accentStyle: React.CSSProperties = {};
  if (accentColor && !dataDisabled) {
    accentStyle.borderLeftColor = accentColor;
    accentStyle.borderLeftWidth = '4px';
  }

  return (
    <div
      ref={btnRef}
      id={id}
      data-block-id={dataBlockId}
      data-disabled={dataDisabled || undefined}
      data-locked={isHovered || undefined}
      onClick={handleClick}
      className={`gaze-tile ${className}`}
      style={{
        ...accentStyle,
        transform: justSelected ? 'scale(0.97)' : 'scale(1)',
        transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.12s ease',
      }}
    >
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-2 p-3">
        {Icon && (
          <span style={accentColor ? { color: accentColor } : undefined}>
            <Icon className="w-7 h-7 md:w-8 md:h-8 shrink-0 opacity-85" />
          </span>
        )}
        <span className="font-semibold text-sm md:text-base lg:text-lg tracking-wide w-full text-center break-words whitespace-normal leading-snug line-clamp-2 text-[var(--iris-text)]">
          {text}
        </span>
      </div>

      {justSelected && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 12,
          background: 'rgba(0, 255, 135, 0.14)',
          animation: 'flash 0.5s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

