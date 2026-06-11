"use client";

import { useState, useEffect } from "react";
import { useIrisStore } from "@/store/useIrisStore";
import { GazeButton } from "./GazeButton";
import { SpeakHandler } from "./SpeakHandler";
import { Hand, Smile, Activity, Check, X, Utensils, CupSoda, Tv, RefreshCcw, Moon, AlertTriangle, Settings, Music, Power, MessageCircle, Bath, PhoneCall, PhoneIncoming, PhoneOff, Wind, Lightbulb, Thermometer } from "lucide-react";
import { StatusBar } from "./StatusBar";
import { LiveKitWrapper } from "./LiveKitWrapper";

/** Category config: icon + CSS custom property accent color */
const CATEGORY_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  "Physical":           { icon: Hand,       accent: "var(--cat-physical)" },
  "Social":             { icon: Smile,      accent: "var(--cat-social)" },
  "Pain":               { icon: Activity,   accent: "var(--cat-pain)" },
  "Yes":                { icon: Check,      accent: "var(--cat-yes)" },
  "No":                 { icon: X,          accent: "var(--cat-no)" },
  "Hungry":             { icon: Utensils,   accent: "var(--cat-hungry)" },
  "Thirsty":            { icon: CupSoda,    accent: "var(--cat-thirsty)" },
  "Toilet":             { icon: Bath,       accent: "var(--cat-toilet)" },
  "Entertainment":      { icon: Tv,         accent: "var(--cat-entertainment)" },
  "Sleep Mode":         { icon: Moon,       accent: "var(--cat-sleep)" },
  "Re-Optimize Layout": { icon: RefreshCcw, accent: "var(--cat-reoptimize)" },
  "Music":              { icon: Music,      accent: "var(--cat-music)" },
  "Environment":        { icon: Thermometer,accent: "var(--cat-environment)" },
};

const PREDICTION_ACCENTS = [
  "var(--pred-speech)",
  "var(--pred-error)",
  "var(--pred-retry)",
];

export function GridUI() {
  const {
    selectedNodes, predictions, isPredicting, coreBlocks,
    activeTone, sleepMode, showMediaModal, showEnvironmentModal, isTranscribing,
    isDebugMode, toggleDebugMode, isContextResponse,
    generatedSpeech, sessionState, setSessionState, doctorCaption, ambientContext
  } = useIrisStore();

  const toneModifiers = ["Sarcastic", "Urgent", "Polite", "Joyful"];

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/session-status", {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await res.json();
        if (data.state !== sessionState) {
          setSessionState(data.state);
        }
      } catch (e) {
        console.error(e);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [sessionState]);

  useEffect(() => {
    if (sessionState === "idle") {
      useIrisStore.getState().setDoctorCaption("");
      useIrisStore.getState().setPatientCaption("");
      useIrisStore.getState().setLiveCaption("");
      useIrisStore.getState().setGeneratedSpeech(null);
      useIrisStore.getState().setIsContextResponse(false);
    }
  }, [sessionState]);

  const initiateCall = async () => {
    await fetch("/api/session-status", { 
      method: "POST", 
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" }, 
      body: JSON.stringify({ state: "calling_doctor" }) 
    });
    setSessionState("calling_doctor");
  };

  const acceptCall = async () => {
    await fetch("/api/session-status", { 
      method: "POST", 
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" }, 
      body: JSON.stringify({ state: "connected" }) 
    });
    setSessionState("connected");
  };

  return (
    <>
      {sessionState === "connected" && (
        <div className="hidden">
          <LiveKitWrapper roomName="iris-telemed-room" participantName="Patient" />
        </div>
      )}

      {sessionState === "calling_patient" && (
        <div className="fixed inset-0 bg-[#F69131] z-[11000] flex items-center justify-center">
          <div className="flex flex-col items-center gap-10 bg-white border-[4px] border-black rounded-[32px] p-16 shadow-[12px_12px_0_0_#000]">
            <div className="w-32 h-32 bg-white border-[4px] border-black rounded-full shadow-[8px_8px_0_0_#000] flex items-center justify-center animate-bounce">
              <PhoneIncoming size={64} className="text-black" />
            </div>
            <h2 className="text-5xl font-black text-black tracking-widest uppercase bg-white px-6 py-2 border-[4px] border-black shadow-[6px_6px_0_0_#000] -rotate-2">
              Doctor is Calling
            </h2>
            <GazeButton
              id="accept-call-block"
              customDwellTime={1500}
              icon={PhoneIncoming}
              className="w-80 h-32 !bg-[#10b981] !border-[4px] !border-black text-white !shadow-[8px_8px_0_0_#000] rotate-1 !rounded-[24px] mt-4"
              text="ACCEPT CALL"
              textClassName="font-black text-3xl tracking-widest uppercase"
              onClick={acceptCall}
            />
          </div>
        </div>
      )}

      {sessionState === "calling_doctor" && (
        <div className="fixed inset-0 bg-[var(--iris-bg)] z-[11000] flex items-center justify-center">
          <div className="flex flex-col items-center gap-10 bg-white border-[4px] border-black rounded-[32px] p-16 shadow-[12px_12px_0_0_#000]">
            <div className="w-32 h-32 bg-[#FECD1B] border-[4px] border-black rounded-full shadow-[8px_8px_0_0_#000] flex items-center justify-center animate-pulse">
              <PhoneCall size={64} className="text-black" />
            </div>
            <h2 className="text-5xl font-black text-black tracking-widest uppercase bg-white px-6 py-2 border-[4px] border-black shadow-[6px_6px_0_0_#000] rotate-2">
              Calling Doctor...
            </h2>
            <GazeButton
              id="cancel-call-block"
              customDwellTime={1500}
              className="w-80 h-32 !bg-[#EF2331] !border-[4px] !border-black text-white !shadow-[8px_8px_0_0_#000] -rotate-1 !rounded-[24px] mt-4"
              text="CANCEL CALL"
              textClassName="font-black text-3xl tracking-widest uppercase"
              onClick={async () => {
                await fetch("/api/session-status", { 
                  method: "POST", 
                  body: JSON.stringify({ state: "idle" }),
                  headers: { "ngrok-skip-browser-warning": "true" }
                });
                setSessionState("idle");
              }}
            />
          </div>
        </div>
      )}
      {/* ── Floating Toolbar ── */}
      <div className="fixed top-4 left-4 z-[9999] flex gap-2">
          {sessionState === "connected" && (
            <div className="flex items-center gap-2 bg-[#10b981] px-4 py-1.5 rounded-lg border-2 border-black shadow-[0_3px_0_black]">
              <PhoneCall size={14} className="text-white animate-pulse" />
              <span className="text-white text-[11px] font-bold tracking-wider uppercase">In Call</span>
              <button 
                onClick={async () => {
                  await fetch("/api/session-status", { method: "POST", body: JSON.stringify({ state: "idle" }) });
                  setSessionState("idle");
                }}
                className="ml-2 bg-[#EF2331] text-white px-2 py-0.5 rounded text-[10px] font-black border border-black hover:bg-red-600"
              >
                END
              </button>
            </div>
          )}
          <button
            onClick={toggleDebugMode}
            className="px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wider border-2 border-black bg-white text-black shadow-[0_3px_0_black] active:translate-y-[3px] active:shadow-none transition-all"
          >
            DEBUG {isDebugMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => useIrisStore.getState().triggerRecenter()}
            className="px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wider border-2 border-black bg-white text-black shadow-[0_3px_0_black] active:translate-y-[3px] active:shadow-none transition-all"
          >
            RE-CENTER (C)
          </button>
        <div className="mx-2 w-px h-6 bg-[var(--iris-border)] opacity-50 self-center" />
        <StatusBar />
      </div>

      {/* ── Transcribing Banner ── */}
      {isTranscribing && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] bg-[#d97706] shadow-lg rounded-b-2xl px-10 py-2.5 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-white animate-[iris-pulse_1s_ease-in-out_infinite]" />
          <span className="text-sm font-bold tracking-wide text-white">Transcribing...</span>
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
      {/* ── Environment Modal ── */}
      {showEnvironmentModal && (
        <div className="fixed inset-0 bg-[var(--iris-bg)] z-[8000] flex flex-col p-8 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-black">Environment Controls</h2>
            <GazeButton
              id="close-env-modal"
              customDwellTime={800}
              icon={X}
              className="w-32 h-16 !bg-[var(--cat-no)]"
              accentColor="var(--cat-no)"
              text="CLOSE"
            />
          </div>
          <div className="grid grid-cols-2 gap-8 flex-1">
            <GazeButton
              id="env-fan-on"
              customDwellTime={1500}
              icon={Wind}
              className="w-full h-full text-4xl"
              accentColor="var(--cat-social)"
              text="FAN ON"
              onClick={() => fetch("/api/room-action", { method: "POST", body: JSON.stringify({ device: "fan", state: "ON" }) })}
            />
            <GazeButton
              id="env-fan-off"
              customDwellTime={1500}
              icon={Wind}
              className="w-full h-full text-4xl"
              accentColor="var(--cat-pain)"
              text="FAN OFF"
              onClick={() => fetch("/api/room-action", { method: "POST", body: JSON.stringify({ device: "fan", state: "OFF" }) })}
            />
            <GazeButton
              id="env-light-on"
              customDwellTime={1500}
              icon={Lightbulb}
              className="w-full h-full text-4xl"
              accentColor="var(--cat-yes)"
              text="LIGHT ON"
              onClick={() => fetch("/api/room-action", { method: "POST", body: JSON.stringify({ device: "light", state: "ON" }) })}
            />
            <GazeButton
              id="env-light-off"
              customDwellTime={1500}
              icon={Lightbulb}
              className="w-full h-full text-4xl"
              accentColor="var(--cat-no)"
              text="LIGHT OFF"
              onClick={() => fetch("/api/room-action", { method: "POST", body: JSON.stringify({ device: "light", state: "OFF" }) })}
            />
          </div>
        </div>
      )}

      {/* ── Media Modal ── */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/90 z-[8000] flex items-center justify-center p-12">
          <div className="w-full h-full rounded-2xl overflow-hidden relative flex flex-col bg-white">
            <GazeButton
              id="close-modal"
              customDwellTime={800}
              icon={X}
              className="absolute top-4 right-4 w-32 h-14 z-10 !bg-[var(--btn-red)] !border-black/20 text-white shadow-sm"
              accentColor="rgba(0,0,0,0.1)"
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
        <div className="fixed inset-0 bg-[#FDF1D0] z-[10000] flex flex-col items-center justify-center p-24">
          {useIrisStore.getState().ambientContext && (
            <div className="mb-12 bg-white px-8 py-4 rounded-2xl border-[4px] border-black shadow-[8px_8px_0_0_#000]">
              <p className="text-4xl font-bold text-black">
                {sessionState === "connected" ? "Dr" : "Heard"}: "{useIrisStore.getState().ambientContext}"
              </p>
            </div>
          )}
          <button
            onClick={() => useIrisStore.getState().clearNodes()}
            className="absolute bottom-12 right-12 bg-transparent border border-[#4a6b63]/30 text-[#4a6b63] font-bold rounded-lg px-6 py-2 hover:bg-[#4a6b63]/10 transition-colors"
          >
            Clear Response
          </button>
          <div className="w-full max-w-7xl h-[45vh] flex gap-10 items-stretch">
            {predictions.map((word, index) => (
              <GazeButton
                key={`centered-pred-${word}-${index}`}
                id={`pred-${word}`}
                data-block-id={word}
                customDwellTime={1500}
                className="flex-1 h-full !rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-b-8 border-black/10"
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
        {sessionState === "connected" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 bg-white border-[3px] border-black px-6 py-2 rounded-full shadow-[4px_4px_0_0_#000]">
            <Activity size={20} className="text-[#EF2331] animate-pulse" />
            <span className="text-black text-sm font-black uppercase tracking-widest">ON CALL</span>
          </div>
        )}
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
                className="h-full w-full"
                accentColor={activeTone === tone ? "#06b6d4" : "#ffffff"}
                textColor="black"
                text={tone}
              />
            ))}
          </div>

          {/* ── Main Grid Area ── */}
          <div className="flex flex-col flex-1 h-full p-4 px-6 overflow-hidden relative">

            <div className="h-[18vh] shrink-0 pb-2 mb-4 flex gap-3 w-full items-stretch">
              {doctorCaption && (
                <div className="flex-[0.8] h-full flex flex-col items-center justify-center bg-[#dcfce3] rounded-2xl p-4 border-4 border-[#166534] shadow-[0_8px_0_#166534]">
                  <span className="text-xs font-black text-[#166534] uppercase tracking-widest mb-1">Doctor Says:</span>
                  <p className="text-xl font-bold tracking-wide text-[#166534] text-center w-full line-clamp-2">
                    "{doctorCaption}"
                  </p>
                </div>
              )}
              {generatedSpeech ? (
                <div className="flex-1 h-full flex flex-col items-center justify-center bg-white rounded-2xl p-4 border-4 border-black shadow-[0_8px_0_black]">
                  {doctorCaption && <span className="text-xs font-black text-black uppercase tracking-widest mb-1">You Say:</span>}
                  <p className="text-3xl font-bold tracking-wide text-black text-center w-full line-clamp-2">
                    {generatedSpeech.replace(/^["']+|["']+$/g, '')}
                  </p>
                </div>
              ) : isPredicting ? (
                <div className="flex-1 flex gap-3">
                  <div className="h-full w-full rounded-[var(--radius-lg)] iris-shimmer" />
                  <div className="h-full w-full rounded-[var(--radius-lg)] iris-shimmer" style={{ animationDelay: "0.2s" }} />
                  <div className="h-full w-full rounded-[var(--radius-lg)] iris-shimmer" style={{ animationDelay: "0.4s" }} />
                </div>
              ) : (
                <div className="flex-1 flex gap-3">
                  {predictions.map((word, index) => (
                    <GazeButton
                      key={`pred-${word}-${index}`}
                      id={`pred-${word}`}
                      data-block-id={word}
                      customDwellTime={1800}
                      className="h-full w-full"
                      accentColor={PREDICTION_ACCENTS[index % PREDICTION_ACCENTS.length]}
                      text={word}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 relative">
              <div className="grid grid-cols-4 grid-rows-3 h-full w-full gap-8">
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
                id={sessionState === "connected" ? "grid-block-EndCall" : "grid-block-CallDoctor"}
                customDwellTime={1000}
                icon={sessionState === "connected" ? PhoneOff : PhoneCall}
                className="flex-1 h-full"
                accentColor={sessionState === "connected" ? "#ef4444" : "var(--btn-navy)"}
                textColor="white"
                text={sessionState === "connected" ? "END CALL" : "CALL DOCTOR"}
                onClick={async () => {
                  if (sessionState === "connected") {
                    await fetch("/api/session-status", { 
                      method: "POST", 
                      body: JSON.stringify({ state: "idle" }),
                      headers: { "ngrok-skip-browser-warning": "true" }
                    });
                    setSessionState("idle");
                  } else {
                    initiateCall();
                  }
                }}
              />
              <GazeButton
                id="grid-block-EMERGENCY"
                customDwellTime={800}
                icon={AlertTriangle}
                className="flex-1 h-full"
                accentColor="#ef4444" // bright red
                textColor="black"
                text="EMERGENCY"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
