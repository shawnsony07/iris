import os
import asyncio
import logging
from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.plugins import deepgram

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))

if "LIVEKIT_URL" not in os.environ and "NEXT_PUBLIC_LIVEKIT_URL" in os.environ:
    os.environ["LIVEKIT_URL"] = os.environ["NEXT_PUBLIC_LIVEKIT_URL"]
logger = logging.getLogger("iris-agent")
logger.setLevel(logging.INFO)

async def entrypoint(ctx: JobContext):
    # Auto-subscribe to audio tracks
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connected to room: {ctx.room.name}")


    # Set up Deepgram STT plugin
    stt = deepgram.STT()

    async def _audio_stream_handler(track: rtc.RemoteAudioTrack, participant: rtc.RemoteParticipant):
        # Create an audio stream from the incoming track
        audio_stream = rtc.AudioStream(track)
        

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
                logger.info(f"track_subscribed: starting pipeline for Doctor")
                asyncio.create_task(_audio_stream_handler(track, participant))
            else:
                logger.info(f"Ignoring audio track from {participant.identity}")

    # Also handle participants already in the room when the agent joins
    for participant in ctx.room.remote_participants.values():
        if participant.identity == "Doctor":
            for publication in participant.track_publications.values():
                if publication.track and publication.track.kind == rtc.TrackKind.KIND_AUDIO:
                    logger.info(f"Found existing Doctor audio track, starting pipeline")
                    asyncio.create_task(_audio_stream_handler(publication.track, participant))

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        logger.info(f"Participant {participant.identity} disconnected. Call is canceled.")

if __name__ == "__main__":
    # The LiveKit CLI automatically reads LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
