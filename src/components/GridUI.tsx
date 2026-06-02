"use client";

import { useIrisStore } from "@/store/useIrisStore";
import { GazeButton } from "./GazeButton";
import { SpeakHandler } from "./SpeakHandler";
import { Hand, Smile, Activity, Check, X, Utensils, CupSoda, Tv, RefreshCcw, Moon, AlertTriangle, Settings, Music, Power, MessageCircle } from "lucide-react";
import { StatusBar } from "./StatusBar";

/** Category config: icon + CSS custom property accent color */
const CATEGORY_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  "Physical":           { icon: Hand,       accent: "var(--cat-physical)" },
  "Social":             { icon: Smile,      accent: "var(--cat-social)" },
  "Pain":               { icon: Activity,   accent: "var(--cat-pain)" },
  "Yes":                { icon: Check,      accent: "var(--cat-yes)" },
  "No":                 { icon: X,          accent: "var(--cat-no)" },
  "Hungry":             { icon: Utensils,   accent: "var(--cat-hungry)" },
  "Thirsty":            { icon: CupSoda,    accent: "var(--cat-thirsty)" },
  "Entertainment":      { icon: Tv,         accent: "var(--cat-entertainment)" },
  "Sleep Mode":         { icon: Moon,       accent: "var(--cat-sleep)" },
  "Re-Optimize Layout": { icon: RefreshCcw, accent: "var(--cat-reoptimize)" },
  "Music":              { icon: Music,      accent: "var(--cat-music)" },
};

/** Rotating accent colors for prediction tiles */
const PREDICTION_ACCENTS = [
  "var(--cat-physical)",
  "var(--cat-social)",
  "var(--cat-pain)",
  "var(--cat-entertainment)",
];

export function GridUI() {
  const {
    selectedNodes, predictions, isPredicting, coreBlocks,
    activeTone, sleepMode, showMediaModal, isTranscribing,
    isDebugMode, toggleDebugMode, isContextResponse,
    generatedSpeech,
  } = useIrisStore();

  const toneModifiers = ["Sarcastic", "Urgent", "Polite", "Joyful"];

  return (
    <>
      {/* ── Floating Toolbar ── */}
      <div className="fixed top-4 left-4 z-[9999] flex gap-2">
        <button
          onClick={toggleDebugMode}
          className="iris-glass rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-wider text-[var(--iris-text-muted)] hover:text-[var(--iris-text)] transition-colors cursor-pointer"
        >
          DEBUG {isDebugMode ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => useIrisStore.getState().triggerRecenter()}
          className="iris-glass rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-wider text-[var(--iris-accent)] hover:bg-[var(--iris-surface-hover)] transition-colors cursor-pointer"
        >
          RE-CENTER (C)
        </button>
        <div className="mx-2 w-px h-6 bg-[var(--iris-border)] opacity-50 self-center" />
        <StatusBar />
      </div>

      {/* ── Transcribing Banner ── */}
      {isTranscribing && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] iris-glass-strong rounded-b-xl px-8 py-2 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--iris-warning)] animate-[iris-pulse_1s_ease-in-out_infinite]" />
          <span className="text-sm font-semibold tracking-wide text-[var(--iris-text)]">Transcribing…</span>
        </div>
      )}

      {/* ── Sleep Mode Overlay ── */}
      {sleepMode && (
        <div className="fixed inset-0 bg-black/95 z-[9000] flex items-center justify-center">
          <GazeButton
            id="wake-block"
            customDwellTime={3000}
            icon={Power}
            className="w-56 h-56"
            accentColor="var(--iris-accent)"
            text="WAKE"
          />
        </div>
      )}

      {/* ── Media Modal ── */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/90 z-[8000] flex items-center justify-center p-12">
          <div className="iris-glass-strong w-full h-full rounded-2xl overflow-hidden relative flex flex-col">
            <GazeButton
              id="close-modal"
              customDwellTime={800}
              icon={X}
              className="absolute top-4 right-4 w-32 h-14 z-10"
              accentColor="var(--iris-danger)"
              text="Close"
            />
            <iframe
              className="w-full h-full pointer-events-auto"
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* ── Centered Response Overlay (Full Screen) ── */}
      {isContextResponse && (
        <div className="fixed inset-0 bg-[#FDF1D0] z-[10000] flex items-center justify-center p-24">
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-[#4a6b63]/80 text-white rounded px-3 py-1.5 text-[11px] font-bold tracking-wider">[DEBUG MODE: OFF]</div>
            <div className="bg-[#4a6b63]/80 text-white rounded px-3 py-1.5 text-[11px] font-bold tracking-wider">[RE-CENTER (C)]</div>
          </div>
          <button
            onClick={() => useIrisStore.getState().clearNodes()}
            className="absolute top-4 right-4 bg-transparent border border-[#4a6b63]/30 text-[#4a6b63] font-bold rounded-lg px-6 py-2 hover:bg-[#4a6b63]/10 transition-colors"
          >
            Clear
          </button>
          <div className="w-full max-w-7xl h-[55vh] flex gap-10 items-stretch">
            {predictions.map((word, index) => (
              <GazeButton
                key={`centered-pred-${word}-${index}`}
                id={`pred-${word}`}
                data-block-id={word}
                customDwellTime={1500}
                className="flex-1 h-full !rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-b-8 border-black/10 !bg-[var(--iris-surface)]"
                accentColor={PREDICTION_ACCENTS[index % PREDICTION_ACCENTS.length]}
                text={word}
                textClassName="text-3xl font-bold text-black"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className={`w-full h-full overflow-hidden flex flex-col transition-opacity duration-500 ${isContextResponse ? "opacity-0 pointer-events-none hidden" : ""}`}>
        <div className="flex w-full h-full pt-6">

          {/* ── Left Tone Column ── */}
          <div className="w-40 flex flex-col gap-3 p-4 pr-0">
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--iris-text-muted)] text-center mb-1">
              Tone
            </span>
            {toneModifiers.map((tone) => (
              <GazeButton
                key={tone}
                id={`tone-block-${tone}`}
                customDwellTime={600}
                icon={MessageCircle}
                className={`h-full w-full ${activeTone === tone ? "!border-[var(--iris-accent)] !bg-[var(--iris-surface-raised)]" : ""}`}
                accentColor={activeTone === tone ? "var(--iris-accent)" : "var(--iris-text-muted)"}
                text={tone}
              />
            ))}
          </div>

          {/* ── Main Grid Area ── */}
          <div className="flex flex-col flex-1 h-full p-4 px-6 overflow-hidden relative">

            <div className="h-[18vh] shrink-0 pb-2 mb-4 flex gap-3 w-full items-stretch">
              {generatedSpeech ? (
                <div className="h-full w-full flex items-center justify-center iris-glass-strong rounded-[var(--radius-lg)] p-6 border border-[var(--iris-accent)]/30 shadow-[0_0_20px_var(--iris-accent)]/10">
                  <p className="text-2xl font-[var(--font-geist-mono)] tracking-wide text-[var(--iris-text)] text-center w-full">
                    "{generatedSpeech}"
                  </p>
                </div>
              ) : isPredicting ? (
                <>
                  <div className="h-full w-full rounded-[var(--radius-lg)] iris-shimmer" />
                  <div className="h-full w-full rounded-[var(--radius-lg)] iris-shimmer" style={{ animationDelay: "0.2s" }} />
                  <div className="h-full w-full rounded-[var(--radius-lg)] iris-shimmer" style={{ animationDelay: "0.4s" }} />
                </>
              ) : (
                predictions.map((word, index) => (
                  <GazeButton
                    key={`pred-${word}-${index}`}
                    id={`pred-${word}`}
                    data-block-id={word}
                    customDwellTime={1800}
                    className="h-full w-full"
                    accentColor={PREDICTION_ACCENTS[index % PREDICTION_ACCENTS.length]}
                    text={word}
                  />
                ))
              )}
            </div>

            {/* Core Grid (bottom ~82%) */}
            <div className="flex-1 min-h-0 relative">
              <div className="grid grid-cols-4 grid-rows-3 h-full w-full gap-3">
                {coreBlocks.map((block, index) => {
                  if (!block) return <div key={`empty-${index}`} className="w-full h-full" />;
                  const isSelected = selectedNodes.includes(block);
                  const cat = CATEGORY_MAP[block];

                  return (
                    <GazeButton
                      key={`core-${block}-${index}`}
                      id={`grid-block-${block}`}
                      data-disabled={isSelected}
                      customDwellTime={1200}
                      icon={cat?.icon}
                      accentColor={cat?.accent}
                      text={block}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right Action Column ── */}
          <div className="flex flex-col gap-3 w-[22%] h-full p-4 pl-0">
            <div className="h-1/3">
              <SpeakHandler />
            </div>

            <div className="flex gap-3 h-1/3">
              <GazeButton
                id="grid-block-Adjust"
                customDwellTime={600}
                icon={Settings}
                className="flex-1 h-full"
                accentColor="var(--iris-text-muted)"
                text="Adjust"
              />
              <GazeButton
                id="grid-block-EMERGENCY"
                customDwellTime={800}
                icon={AlertTriangle}
                className="flex-1 h-full !border-[var(--iris-danger)]/30"
                accentColor="var(--iris-danger)"
                text="EMERGENCY"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
