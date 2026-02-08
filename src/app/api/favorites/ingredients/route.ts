import { NextRequest, NextResponse } from 'next/server';
import {
  addFavoriteIngredient,
  removeFavoriteIngredient,
  getHousehold
} from '@/lib/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredient, householdId } = body;

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient is required' },
        { status: 400 }
      );
    }

    const defaultHouseholdId = householdId || 'default-household';
    const household = addFavoriteIngredient(defaultHouseholdId, ingredient);

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
    const body = await request.json();
    const { ingredient, householdId } = body;

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient is required' },
        { status: 400 }
      );
    }

    const defaultHouseholdId = householdId || 'default-household';
    const household = removeFavoriteIngredient(defaultHouseholdId, ingredient);

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
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId') || 'default-household';

    const household = getHousehold(householdId);

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
