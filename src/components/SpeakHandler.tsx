"use client";
import { useEffect, useState } from "react";
import { useIrisStore } from "@/store/useIrisStore";
import { webLlmService } from "@/utils/webLlmService";
import { ttsService } from "@/utils/ttsService";
import { GazeButton } from "./GazeButton";
import { Volume2 } from "lucide-react";

export function SpeakHandler() {
  const { selectedNodes, clearNodes } = useIrisStore();
  const [status, setStatus] = useState("Loading Model…");
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
      setStatus("Ready");
    });
  }, []);

  useEffect(() => {
    const el = document.getElementById("speak-block");
    const handleDwell = async () => {
      if (!isReady || selectedNodes.length === 0 || isSpeaking) return;
      
      setIsSpeaking(true);
      setStatus("Generating…");
      try {
        const sentence = await webLlmService.generate(selectedNodes);
        setStatus("Speaking…");
        useIrisStore.getState().setGeneratedSpeech(sentence);
        await ttsService.speak(sentence);
        clearNodes();
        setIsSpeaking(false);
        setStatus("Ready");
      } catch (e) {
        console.error(e);
        clearNodes();
        setIsSpeaking(false);
        setStatus("Ready");
      }
    };

    el?.addEventListener('dwell-click', handleDwell);
    return () => el?.removeEventListener('dwell-click', handleDwell);
  }, [selectedNodes, isReady, isSpeaking, clearNodes]);

  const canSpeak = isReady && selectedNodes.length > 0 && !isSpeaking;

  return (
    <div className="flex flex-col gap-2 w-full h-full justify-center">
      <GazeButton
        id="speak-block"
        data-disabled={!canSpeak}
        customDwellTime={800}
        icon={Volume2}
        className="w-full h-full"
        accentColor="#10b981" // bright green
        textColor="black"
        text="SPEAK"
      />
      <div className="text-[11px] text-[var(--iris-text-muted)] text-center font-[var(--font-geist-mono)] tracking-wide truncate h-5 shrink-0 leading-5">
        {status}
      </div>
    </div>
  );
}
