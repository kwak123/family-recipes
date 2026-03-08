import { NextRequest, NextResponse } from 'next/server';
import {
  addFavoriteIngredient,
  removeFavoriteIngredient,
  getHousehold,
  getUser
} from '@/lib/firestore-db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session.user.id);
    const defaultHouseholdId = user?.currentHomeId || 'default-household';

    const body = await request.json();
    const { ingredient } = body;

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient is required' },
        { status: 400 }
      );
    }

    const household = await addFavoriteIngredient(defaultHouseholdId, ingredient);

    return NextResponse.json({
      success: true,
      favoriteIngredients: household.favoriteIngredients
    });
  } catch (error) {
    console.error('Add favorite ingredient error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to add favorite ingredient';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session.user.id);
    const defaultHouseholdId = user?.currentHomeId || 'default-household';

    const body = await request.json();
    const { ingredient } = body;

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient is required' },
        { status: 400 }
      );
    }

    const household = await removeFavoriteIngredient(defaultHouseholdId, ingredient);

    return NextResponse.json({
      success: true,
      favoriteIngredients: household.favoriteIngredients
    });
  } catch (error) {
    console.error('Remove favorite ingredient error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to remove favorite ingredient';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session.user.id);
    const householdId = user?.currentHomeId || 'default-household';

    const household = await getHousehold(householdId);

    if (!household) {
      return NextResponse.json({
        favoriteIngredients: []
      });
    }

    return NextResponse.json({
      favoriteIngredients: household.favoriteIngredients
    });
  } catch (error) {
    console.error('Get favorite ingredients error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite ingredients' },
      { status: 500 }
    );
  }
}
