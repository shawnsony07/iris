"use client";

import { useEffect, useRef, useState } from "react";
import { useIrisStore } from "@/store/useIrisStore";

export function CursorOverlay() {
  const { cursor, addNode, clearNodes } = useIrisStore();
  const [dwellProgress, setDwellProgress] = useState(0);
  
  const currentHoverRef = useRef<Element | null>(null);
  const hoverStartRef = useRef<number>(0);
  const lastSelectedRef = useRef<Element | null>(null);
  const awayStartRef = useRef<number>(0);

  useEffect(() => {
    // Uses elementsFromPoint to find targets beneath the hidden cursor
    const hoveredElements = document.elementsFromPoint(cursor.x, cursor.y);
    const target = hoveredElements.find(el => {
      if (el.getAttribute("data-disabled") === "true") return false;
      return el.id.startsWith("grid-block-") || 
             el.id === "speak-block" || 
             el.id === "clear-block";
    }) || null;

    if (target !== currentHoverRef.current) {
      currentHoverRef.current = target;
      hoverStartRef.current = performance.now();
      setDwellProgress(0);
    }

    // Only clear the lock if the user has been away from the locked target for at least 500ms
    // to prevent micro-saccades or webcam noise from causing repeated double-selections.
    if (lastSelectedRef.current) {
      if (target === lastSelectedRef.current) {
        awayStartRef.current = 0; // reset away timer since we are back on the locked target
      } else {
        if (awayStartRef.current === 0) {
          awayStartRef.current = performance.now();
        } else if (performance.now() - awayStartRef.current > 500) {
          lastSelectedRef.current = null;
          awayStartRef.current = 0;
        }
      }
    }

    if (target && target === currentHoverRef.current) {
      if (target === lastSelectedRef.current) {
        // Already selected, keep visually 0.
        setDwellProgress(0);
      } else {
        const dwellTime = performance.now() - hoverStartRef.current;
        if (dwellTime >= 800) {
          if (target.id === "speak-block") {
            target.dispatchEvent(new CustomEvent('dwell-click'));
          } else if (target.id === "clear-block") {
            clearNodes();
          } else {
            const nodeVal = target.id.replace("grid-block-", "");
            addNode(nodeVal);
          }
          lastSelectedRef.current = target; // Lock
          setDwellProgress(0);
        } else {
          setDwellProgress(dwellTime / 800);
        }
      }
    }
  }, [cursor, addNode, clearNodes]);

  return (
    <div
      style={{
        position: 'fixed',
        left: cursor.x,
        top: cursor.y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="20" fill="rgba(255, 0, 0, 0.5)" />
        {dwellProgress > 0 && (
          <circle
            cx="30"
            cy="30"
            r="24"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeDasharray="150"
            strokeDashoffset={150 - (150 * dwellProgress)}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        )}
      </svg>
    </div>
  );
}
