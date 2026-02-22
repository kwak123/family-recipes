import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-utils';
import {
  getPendingUserInvites,
  sendUserInvite,
  revokeUserInvite,
  getUser
} from '@/lib/json-db';

/**
 * GET /api/admin/invites
 * List all pending invites (admin only)
 */
export async function GET() {
  try {
    await requireAdmin();

    const invites = getPendingUserInvites();

    // Enhance invites with inviter names
    const invitesWithNames = invites.map(invite => {
      const inviter = getUser(invite.invitedBy);
      return {
        ...invite,
        inviterName: inviter?.name || 'Unknown'
      };
    });

    return NextResponse.json(invitesWithNames);
  } catch (error) {
    console.error('Error getting invites:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to get invites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invites
 * Send a new invite (admin only)
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

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

    const invite = sendUserInvite(admin.id, email);

    return NextResponse.json(
      { success: true, invite },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending invite:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

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

/**
 * DELETE /api/admin/invites
 * Revoke an invite (admin only)
 * Body: { email: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    revokeUserInvite(email);

    return NextResponse.json(
      { success: true, message: 'Invite revoked' }
    );
  } catch (error) {
    console.error('Error revoking invite:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to revoke invite' },
      { status: 500 }
    );
  }
}
