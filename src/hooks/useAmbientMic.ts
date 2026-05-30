import { useState, useCallback, useEffect } from "react";
import { useIrisStore } from "@/store/useIrisStore";
import { webLlmService } from "@/utils/webLlmService";

let recognitionInstance: any = null;

export function useAmbientMic() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const toggleMic = useCallback(() => {
    const state = useIrisStore.getState();
    
    if (state.isListening) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    } else {
      if (!recognitionInstance) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setToastMessage("Ambient Microphone requires Chrome or Edge to function.");
          return;
        }

        recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = false;

        recognitionInstance.onstart = () => {
          useIrisStore.getState().setIsListening(true);
        };

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          if (transcript) {
            useIrisStore.getState().setAmbientContext(transcript);
            webLlmService.predictFromAmbientContext(transcript);
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setToastMessage("Microphone access denied.");
          } else if (event.error === "network") {
            setToastMessage("Ambient Microphone requires Chrome or Edge to function.");
          }
          useIrisStore.getState().setIsListening(false);
        };

        recognitionInstance.onend = () => {
          useIrisStore.getState().setIsListening(false);
        };
      }

      try {
        recognitionInstance.start();
      } catch (err) {
        console.error("Error starting mic", err);
        setToastMessage("Error starting microphone. Permission may be blocked.");
      }
    }
  }, []);

  return { toggleMic, toastMessage };
}
