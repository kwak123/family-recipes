import { NextRequest, NextResponse } from 'next/server';
import { getRecipesByHousehold, getUser } from '@/lib/firestore-db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session.user.id);
    const householdId = user?.currentHomeId || 'default-household';

    const recipes = await getRecipesByHousehold(householdId, false);

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Get recipes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
