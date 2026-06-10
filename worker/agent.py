import asyncio
import logging
from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.plugins import deepgram, silero

load_dotenv()
logger = logging.getLogger("iris-agent")
logger.setLevel(logging.INFO)

async def entrypoint(ctx: JobContext):
    # Auto-subscribe to audio tracks
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connected to room: {ctx.room.name}")

    # Set up Silero VAD for detecting when speech starts/stops
    vad = silero.VAD.load()
    
    # Set up Deepgram STT plugin
    stt = deepgram.STT()

    async def _audio_stream_handler(track: rtc.RemoteAudioTrack, participant: rtc.RemoteParticipant):
        # Create an audio stream from the incoming track
        audio_stream = rtc.AudioStream(track)
        
        # Pass the raw audio stream into VAD
        vad_stream = vad.stream()
        
        # We also need a stream for STT
        stt_stream = stt.stream()

        from livekit.agents import stt as lk_stt
        # Listen for transcription events and send to Data Channel
        async def _listen_stt():
            async for event in stt_stream:
                if event.type == lk_stt.SpeechEventType.FINAL_TRANSCRIPT:
                    transcript = event.alternatives[0].text
                    if transcript.strip():
                        logger.info(f"Transcript: {transcript}")
                        # Send the transcript via Data Channel
                        await ctx.room.local_participant.publish_data(
                            payload=transcript.encode("utf-8"),
                            topic="doctor_transcript"
                        )
        
        asyncio.create_task(_listen_stt())

        logger.info(f"Starting audio pipeline for {participant.identity}")
        
        # Forward incoming audio frames to STT stream directly.
        # Note: Depending on the STT plugin, we can pass frames directly or use VAD to segment.
        # For simplicity, we can pass all audio frames to Deepgram, as Deepgram handles endpointing well internally.
        async for event in audio_stream:
            stt_stream.push_frame(event.frame)
            
    # When a participant publishes an audio track
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            if participant.identity == "Doctor":
                asyncio.create_task(_audio_stream_handler(track, participant))
            else:
                logger.info(f"Ignoring audio track from {participant.identity}")

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        logger.info(f"Participant {participant.identity} disconnected. Call is canceled.")

if __name__ == "__main__":
    # The LiveKit CLI automatically reads LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
