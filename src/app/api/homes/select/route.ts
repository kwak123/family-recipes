import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { setCurrentHome } from '@/lib/json-db';

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

    const user = setCurrentHome(session.user.id, homeId);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error selecting home:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to select home' },
      { status: 500 }
    );
  }
}
