import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOutgoingHomeInvites, isHouseholdMember, revokeHomeInvite } from '@/lib/firestore-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { homeId } = await params;

    // Verify user has access to this home
    if (!await isHouseholdMember(homeId, session.user.id)) {
      return NextResponse.json(
        { error: 'You do not have access to this home' },
        { status: 403 }
      );
    }

    const outgoingInvites = await getOutgoingHomeInvites(homeId);

    return NextResponse.json({ invites: outgoingInvites });
  } catch (error) {
    console.error('Error fetching outgoing invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outgoing invites' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { homeId } = await params;
    const body = await request.json();
    const { inviteeUserId } = body;

    if (!inviteeUserId || typeof inviteeUserId !== 'string') {
      return NextResponse.json(
        { error: 'Invitee user ID is required' },
        { status: 400 }
      );
    }

    await revokeHomeInvite(homeId, session.user.id, inviteeUserId);

    return NextResponse.json({ message: 'Invite revoked successfully' });
  } catch (error) {
    console.error('Error revoking invite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke invite' },
      { status: 500 }
    );
  }
}
