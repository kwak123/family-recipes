import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteHousehold } from '@/lib/firestore-db';

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
    await deleteHousehold(homeId, session.user.id);

    return NextResponse.json({ message: 'Home deleted successfully' });
  } catch (error) {
    console.error('Error deleting home:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete home' },
      { status: error instanceof Error && error.message === 'Only the owner can delete this home' ? 403 : 500 }
    );
  }
}
