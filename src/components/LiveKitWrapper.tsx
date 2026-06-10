"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useDataChannel,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { useIrisStore } from "@/store/useIrisStore";
import { ttsService } from "@/utils/ttsService";

interface LiveKitWrapperProps {
  roomName: string;
  participantName: string;
}

export function LiveKitWrapper({ roomName, participantName }: LiveKitWrapperProps) {
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit/token?room=${roomName}&participantName=${participantName}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomName, participantName]);

  // For the patient, we don't want to publish the real microphone, only the TTS stream.
  // For the doctor, we DO want to publish the real microphone.
  const isDoctor = participantName === "Doctor";

  useEffect(() => {
    if (!isDoctor) {
      // Ensure the TTS audio context and stream are created so we can publish it
      // even before the first word is spoken.
      // @ts-ignore - access private method for initialization
      if (ttsService.ensureAudioContext) ttsService.ensureAudioContext();
    }
  }, [isDoctor]);

  if (token === "") {
    return <div>Connecting to Telemedicine Session...</div>;
  }

  // NOTE: You must provide a valid LIVEKIT_URL in your .env.local
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  return (
    <LiveKitRoom
      video={false}
      audio={isDoctor}
      token={token}
      serverUrl={serverUrl}
      connect={true}
    >
      <RoomAudioRenderer />
      <DataChannelManager isDoctor={isDoctor} />
      {!isDoctor && <TTSAudioPublisher />}
    </LiveKitRoom>
  );
}

// Subcomponent to listen and publish data channels
function DataChannelManager({ isDoctor }: { isDoctor: boolean }) {
  const setLiveCaption = useIrisStore((state) => state.setLiveCaption);
  const setDoctorCaption = useIrisStore((state) => state.setDoctorCaption);
  const setPatientCaption = useIrisStore((state) => state.setPatientCaption);
  const generatedSpeech = useIrisStore((state) => state.generatedSpeech);
  
  // Single data channel listener for all topics to avoid multi-hook conflicts
  const { send } = useDataChannel((msg) => {
    const text = new TextDecoder().decode(msg.payload);
    
    if (msg.topic === "doctor_transcript") {
      const cleanText = text.replace(/\[BLANK_AUDIO\]/gi, "").trim();
      if (!cleanText) return; // ignore silence
      
      if (isDoctor) {
        setDoctorCaption(cleanText);
      } else {
        setLiveCaption(cleanText); // used for predictive trigger on patient side
        setDoctorCaption(cleanText); // store doctor's speech globally

        
        // Trigger local predictive LLM when the doctor finishes speaking
        // @ts-ignore
        if (window.doctorSpeechTimeout) clearTimeout(window.doctorSpeechTimeout);
        // @ts-ignore
        window.doctorSpeechTimeout = setTimeout(() => {
          import("@/utils/webLlmService").then(({ webLlmService }) => {
            webLlmService.predictFromAmbientContext(text);
          });
        }, 1500);
      }
    } else if (msg.topic === "patient_text") {
      if (isDoctor) {
        setPatientCaption(text);
      }
    }
  });
  const room = useRoomContext();

  useEffect(() => {
    // When the patient generates speech, send the exact text to the doctor over the data channel
    if (!isDoctor && generatedSpeech && room && room.localParticipant) {
      const payload = new TextEncoder().encode(generatedSpeech);
      room.localParticipant.publishData(payload, { reliable: true, topic: "patient_text" }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedSpeech, isDoctor, room]);

  return null;
}

import { Track } from "livekit-client";

// Subcomponent to publish TTS audio as a mic track
function TTSAudioPublisher() {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    // If we have a local audio stream from TTS, publish it
    if (localParticipant && ttsService.localAudioStream) {
      const audioTrack = ttsService.localAudioStream.getAudioTracks()[0];
      if (audioTrack) {
        localParticipant.publishTrack(audioTrack, {
          name: "patient_tts",
          source: Track.Source.Microphone, // LiveKit source type
        }).catch(err => {
          if (err?.message?.includes("already been published")) return;
          console.error("Failed to publish TTS track:", err);
        });
      }
    }
  }, [localParticipant]);

  return null;
}
