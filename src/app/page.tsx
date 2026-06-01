"use client";

import { useEffect, useRef } from "react";
import { useIrisStore } from "@/store/useIrisStore";
import { GridUI } from "@/components/GridUI";
import { NodeBuilder } from "@/components/NodeBuilder";
import { useWhisperMic } from "@/hooks/useWhisperMic";
import { GazeProvider } from "@/components/GazeProvider";
import { useGaze } from "@/lib/gazeContext";
import { GazeCursor } from "@/components/GazeCursor";
import { CalibrationOverlay } from "@/components/CalibrationOverlay";

function AppContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { sttReady, sttDownloadProgress, liveCaption, sttError } = useIrisStore();
  
  // Use the stream provided by the eye tracker
  const { stream, startCalibration } = useGaze();
  
  // Wire whisper mic to the eye tracker's stream
  useWhisperMic(stream);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Recenter keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        useIrisStore.getState().triggerRecenter();
      } else if (e.code === 'KeyC') {
        startCalibration();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--iris-bg)] text-[var(--iris-text)] relative pt-12">
      <CalibrationOverlay />
      
      {/* Video Preview — glass card */}
      <div className="fixed bottom-4 right-4 w-56 rounded-xl z-50 overflow-hidden iris-glass" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto opacity-60 [transform:scaleX(-1)]"
        />
        {sttError && (
          <div className="absolute inset-0 bg-[var(--iris-danger)]/90 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-white font-semibold text-xs mb-1">WHISPER ERROR</span>
            <span className="text-white/80 text-[10px] leading-tight truncate w-full">{sttError}</span>
          </div>
        )}
        {!sttReady && !sttError && (
          <div className="absolute bottom-0 left-0 w-full h-5 bg-black/70 flex items-center justify-center">
            <div
              className="absolute left-0 top-0 h-full transition-all duration-300"
              style={{ width: `${sttDownloadProgress}%`, background: "var(--iris-accent)" }}
            />
            <span className="relative z-10 text-[9px] font-medium tracking-wider text-[var(--iris-text-secondary)]">
              WHISPER {sttDownloadProgress}%
            </span>
          </div>
        )}
        {sttReady && liveCaption && !sttError && (
          <div className="absolute bottom-0 left-0 w-full min-h-[20%] iris-glass-strong flex items-center justify-center p-2">
            <span className="text-sm font-semibold text-[var(--iris-accent)] text-center leading-snug tracking-wide">
              {liveCaption}
            </span>
          </div>
        )}
      </div>

      <NodeBuilder />

      <div className="flex-1 min-h-0 w-full h-full z-10 relative">
        <GridUI />
      </div>

      <GazeCursor />
    </main>
  );
}

export default function Home() {
  return (
    <GazeProvider>
      <AppContent />
    </GazeProvider>
  );
}

