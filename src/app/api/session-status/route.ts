import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export type SessionState = 'idle' | 'calling_doctor' | 'calling_patient' | 'connected';

// Define the global state structure
interface GlobalState {
  state: SessionState;
  timer: NodeJS.Timeout | null;
}

// Attach to globalThis to survive HMR during dev
const globalAny: any = global;
if (!globalAny.irisSession) {
  globalAny.irisSession = {
    state: 'idle',
    timer: null,
  } as GlobalState;
}

export async function GET() {
  const session = globalAny.irisSession as GlobalState;
  return NextResponse.json({ state: session.state });
}

export async function POST(req: NextRequest) {
  try {
    const { state: newState } = await req.json();
    const session = globalAny.irisSession as GlobalState;

    if (!['idle', 'calling_doctor', 'calling_patient', 'connected'].includes(newState)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Clear existing timer if any
    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = null;
    }

    session.state = newState as SessionState;

    // Auto-expire after 30 seconds if calling
    if (newState === 'calling_doctor' || newState === 'calling_patient') {
      session.timer = setTimeout(() => {
        if (globalAny.irisSession.state === newState) {
          globalAny.irisSession.state = 'idle';
          console.log(`[Signaling] Call timed out. Reset to idle.`);
        }
      }, 30000);
    }

    return NextResponse.json({ state: session.state });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}
