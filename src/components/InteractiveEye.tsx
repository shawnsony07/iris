"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function InteractiveEye() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth the mouse movement for the pupil
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from center (clamped so pupil stays inside iris)
      const maxDistance = 24; // max translation in pixels for the pupil
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Calculate angle
      const angle = Math.atan2(deltaY, deltaX);
      
      // Map distance to a capped value (non-linear for better feel)
      // If distance is large, pupil hits the edge (maxDistance)
      const clampedDistance = Math.min(distance * 0.1, maxDistance);
      
      const pupilX = Math.cos(angle) * clampedDistance;
      const pupilY = Math.sin(angle) * clampedDistance;

      mouseX.set(pupilX);
      mouseY.set(pupilY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef}
      className="relative w-48 h-24 md:w-64 md:h-32 flex items-center justify-center"
    >
      {/* Sclera (White part) */}
      <div className="absolute inset-0 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden" 
           style={{ borderRadius: "100% 0 100% 0", transform: "rotate(45deg)" }}>
        {/* Iris container (unrotated) */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "rotate(-45deg)" }}>
          
          {/* Iris */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 bg-[var(--cat-physical)] border-4 border-slate-900 rounded-full flex items-center justify-center overflow-hidden">
            
            {/* Pupil */}
            <motion.div 
              style={{ x: smoothMouseX, y: smoothMouseY }}
              className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-full flex items-center justify-center relative"
            >
              {/* Eye Catchlight (Reflection) */}
              <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-80" />
              <div className="absolute top-3 left-4 w-1 h-1 bg-white rounded-full opacity-50" />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
