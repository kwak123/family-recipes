import { NextRequest, NextResponse } from 'next/server';
import {
  addFavoriteRecipe,
  removeFavoriteRecipe,
  getHousehold
} from '@/lib/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId, householdId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const defaultHouseholdId = householdId || 'default-household';
    const household = addFavoriteRecipe(defaultHouseholdId, recipeId);

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
    const body = await request.json();
    const { recipeId, householdId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const defaultHouseholdId = householdId || 'default-household';
    const household = removeFavoriteRecipe(defaultHouseholdId, recipeId);

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
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId') || 'default-household';

    const household = getHousehold(householdId);

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
