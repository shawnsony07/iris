"use client";
import { useEffect, useState } from "react";
import { useIrisStore } from "@/store/useIrisStore";
import { webLlmService } from "@/utils/webLlmService";
import { ttsService } from "@/utils/ttsService";

export function SpeakHandler() {
  const { selectedNodes, clearNodes } = useIrisStore();
  const [status, setStatus] = useState("Loading Model...");
  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    webLlmService.init((msg) => {
      setStatus(msg);
      if (msg.includes("Finish") || msg.includes("Loaded")) {
        setIsReady(true);
      }
    }).then(() => {
      setIsReady(true);
      setStatus("Model Ready");
    });
  }, []);

  useEffect(() => {
    const el = document.getElementById("speak-block");
    const handleDwell = async () => {
      if (!isReady || selectedNodes.length === 0 || isSpeaking) return;
      
      setIsSpeaking(true);
      setStatus("Generating...");
      try {
        const sentence = await webLlmService.generate(selectedNodes);
        setStatus("Speaking...");
        
        await ttsService.speak(sentence);
        
        setIsSpeaking(false);
        setStatus("Model Ready");
        clearNodes();
      } catch (e) {
        console.error(e);
        setIsSpeaking(false);
        setStatus("Model Ready");
      }
    };

    el?.addEventListener('dwell-click', handleDwell);
    return () => el?.removeEventListener('dwell-click', handleDwell);
  }, [selectedNodes, isReady, isSpeaking, clearNodes]);

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full justify-center">
      <div 
        id="speak-block"
        data-disabled={!isReady || selectedNodes.length === 0 || isSpeaking}
        className={`w-full py-16 flex items-center justify-center text-4xl font-black text-white rounded-2xl shadow-2xl border-8 transition-colors ${
          (isReady && selectedNodes.length > 0 && !isSpeaking) 
            ? 'bg-green-600 border-green-400' 
            : 'bg-gray-600 border-gray-400 opacity-50'
        }`}
      >
        SPEAK
      </div>
      <div className="text-sm text-slate-400 text-center font-mono break-all line-clamp-2 h-10">
        {status}
      </div>
    </div>
  );
}
