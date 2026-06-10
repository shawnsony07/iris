import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get('room') || 'iris-telemed-room';
    const participantName = searchParams.get('participantName') || 'Patient';

    // Check in-memory global state
    const globalAny: any = global;
    const sessionState = globalAny.irisSession?.state || 'idle';
    if (sessionState !== 'connected') {
      return NextResponse.json(
        { error: 'Call not active. Cannot issue WebRTC token.' },
        { status: 403 }
      );
    }

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: 'LiveKit API credentials missing.' },
        { status: 500 }
      );
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
        name: participantName,
      }
    );

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });

    return NextResponse.json({ token: await at.toJwt() });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
