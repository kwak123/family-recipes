import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendPlatformInvite } from '@/lib/firestore-db';

/**
 * POST /api/invite
 * Send a platform invite to an email address.
 * Any authenticated user can use this route.
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be signed in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const invite = await sendPlatformInvite(session.user.id, email.trim().toLowerCase());

    return NextResponse.json(
      { success: true, invite },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending platform invite:', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists') || error.message.includes('already been invited')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    );
  }
}
