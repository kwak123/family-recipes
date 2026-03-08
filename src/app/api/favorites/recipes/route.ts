import { NextRequest, NextResponse } from 'next/server';
import {
  addFavoriteRecipe,
  removeFavoriteRecipe,
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
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const household = await addFavoriteRecipe(defaultHouseholdId, recipeId);

    return NextResponse.json({
      success: true,
      favoriteRecipeIds: household.favoriteRecipeIds
    });
  } catch (error) {
    console.error('Add favorite recipe error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to add favorite recipe';

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
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const household = await removeFavoriteRecipe(defaultHouseholdId, recipeId);

    return NextResponse.json({
      success: true,
      favoriteRecipeIds: household.favoriteRecipeIds
    });
  } catch (error) {
    console.error('Remove favorite recipe error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to remove favorite recipe';

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
        favoriteRecipeIds: []
      });
    }

    return NextResponse.json({
      favoriteRecipeIds: household.favoriteRecipeIds
    });
  } catch (error) {
    console.error('Get favorite recipes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite recipes' },
      { status: 500 }
    );
  }
}
