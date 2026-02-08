import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserHouseholds, createHousehold, getUser } from '@/lib/json-db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const homes = getUserHouseholds(session.user.id);
    const user = getUser(session.user.id);

    return NextResponse.json({
      homes,
      currentHomeId: user?.currentHomeId
    });
  } catch (error) {
    console.error('Error fetching homes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homes' },
      { status: 500 }
    );
  }
}

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
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Home name is required' },
        { status: 400 }
      );
    }

    const home = createHousehold(name.trim(), session.user.id);

    return NextResponse.json({ home }, { status: 201 });
  } catch (error) {
    console.error('Error creating home:', error);
    return NextResponse.json(
      { error: 'Failed to create home' },
      { status: 500 }
    );
  }
}
