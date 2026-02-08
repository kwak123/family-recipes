import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acceptHomeInvite } from '@/lib/json-db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { homeId } = body;

    if (!homeId || typeof homeId !== 'string') {
      return NextResponse.json(
        { error: 'Home ID is required' },
        { status: 400 }
      );
    }

    const home = acceptHomeInvite(session.user.id, homeId);

    return NextResponse.json({ home });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
