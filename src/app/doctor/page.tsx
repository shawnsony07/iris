"use client";

import { useState, useEffect } from "react";
import { PhoneCall, PhoneIncoming, PhoneOff, Activity } from "lucide-react";
import { LiveKitWrapper } from "@/components/LiveKitWrapper";
import { useIrisStore } from "@/store/useIrisStore";

export default function DoctorPortal() {
  const { sessionState, setSessionState } = useIrisStore();
  const doctorCaption = useIrisStore((state) => state.doctorCaption);
  const patientCaption = useIrisStore((state) => state.patientCaption);

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

  const initiateCall = async () => {
    await fetch("/api/session-status", { 
      method: "POST", 
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" }, 
      body: JSON.stringify({ state: "calling_patient" }) 
    });
    setSessionState("calling_patient");
  };

  const acceptCall = async () => {
    await fetch("/api/session-status", { 
      method: "POST", 
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" }, 
      body: JSON.stringify({ state: "connected" }) 
    });
    setSessionState("connected");
  };

  const endCall = async () => {
    await fetch("/api/session-status", { 
      method: "POST", 
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" }, 
      body: JSON.stringify({ state: "idle" }) 
    });
    setSessionState("idle");
  };

  // Neobrutalist button classes
  const btnBase = "border-[3px] border-black rounded-[24px] font-bold flex items-center justify-center gap-4 transition-all active:translate-y-[6px] active:shadow-[0_0px_0_0_#000]";

  return (
    <div className="min-h-screen bg-[var(--iris-bg)] text-black flex flex-col items-center justify-center font-sans p-8">
      
      <div className="max-w-3xl w-full bg-white rounded-[32px] border-[4px] border-black shadow-[12px_12px_0_0_#000] p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden">
        
        <div className="flex justify-between items-center border-b-4 border-black pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase text-black">Iris Doctor</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-black font-bold uppercase tracking-wider">Status:</span>
              <span className={`px-4 py-1 border-[3px] border-black rounded-full font-bold uppercase text-sm shadow-[2px_2px_0_0_#000]
                ${sessionState === 'idle' ? 'bg-gray-200' : 
                  sessionState === 'connected' ? 'bg-[#10b981] text-white' : 
                  'bg-[#FECD1B] animate-pulse'}`}
              >
                {sessionState.replace('_', ' ')}
              </span>
            </div>
          </div>
          {sessionState === "connected" && (
            <button 
              onClick={endCall} 
              className={`${btnBase} bg-[#EF2331] text-white px-8 py-4 text-xl shadow-[6px_6px_0_0_#000] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000]`}
            >
              <PhoneOff size={24} /> END CALL
            </button>
          )}
        </div>

        {/* State Management Panels */}
        {sessionState === "idle" && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <button 
              onClick={initiateCall} 
              className={`${btnBase} bg-[#15ADF4] text-white w-72 h-24 text-2xl shadow-[8px_8px_0_0_#000] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000]`}
            >
              <PhoneCall size={32} />
              CALL PATIENT
            </button>
          </div>
        )}

        {sessionState === "calling_patient" && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-24 h-24 bg-[#FECD1B] border-[4px] border-black rounded-full shadow-[6px_6px_0_0_#000] flex items-center justify-center animate-bounce">
              <PhoneCall size={40} className="text-black" />
            </div>
            <div className="text-black font-black uppercase text-2xl tracking-widest">Dialing Patient...</div>
            <button 
              onClick={endCall} 
              className={`${btnBase} bg-[#EF2331] text-white px-6 py-3 mt-4 text-lg shadow-[4px_4px_0_0_#000] hover:translate-y-[2px] hover:shadow-[2px_4px_0_0_#000]`}
            >
              CANCEL
            </button>
          </div>
        )}

        {sessionState === "calling_doctor" && (
          <div className="flex flex-col items-center justify-center py-12 gap-10 bg-[#F69131] border-[4px] border-black rounded-[24px] shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] -mx-4">
            <div className="w-32 h-32 bg-white border-[4px] border-black rounded-full shadow-[8px_8px_0_0_#000] flex items-center justify-center animate-bounce">
              <PhoneIncoming size={64} className="text-black" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-widest bg-white px-6 py-2 border-[4px] border-black shadow-[6px_6px_0_0_#000] -rotate-2">
              Incoming Call
            </h2>
            <button 
              onClick={acceptCall}
              className={`${btnBase} bg-[#10b981] text-white px-12 py-6 text-3xl shadow-[8px_8px_0_0_#000] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000] rotate-1`}
            >
              <PhoneCall size={36} /> ACCEPT
            </button>
          </div>
        )}

        {sessionState === "connected" && (
          <div className="flex flex-col gap-6">
            <div className="bg-gray-100 rounded-[24px] p-8 min-h-64 border-[4px] border-black shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] relative flex flex-col gap-8">
              <div className="absolute top-0 left-8 -translate-y-1/2 flex items-center gap-3 bg-white border-[3px] border-black px-4 py-2 rounded-full shadow-[4px_4px_0_0_#000]">
                <Activity size={18} className="text-[#EF2331] animate-pulse" />
                <span className="text-black text-sm font-black uppercase tracking-widest">Live Transcription</span>
              </div>
              
              <div className="flex flex-col gap-2 border-b-2 border-black/10 pb-6">
                <span className="text-sm font-bold text-black/50 uppercase tracking-widest">Patient Says:</span>
                <div className="text-3xl font-bold leading-relaxed text-[#EF2331]">
                  {patientCaption || <span className="opacity-40 italic">Waiting for patient...</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-black/50 uppercase tracking-widest">You Said:</span>
                <div className="text-2xl font-bold leading-relaxed text-black/80">
                  {doctorCaption || <span className="opacity-40 italic">Waiting for you to speak...</span>}
                </div>
              </div>
            </div>
            
            <div className="hidden">
              <LiveKitWrapper roomName="iris-telemed-room" participantName="Doctor" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
