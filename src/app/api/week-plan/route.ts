import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentWeekPlan,
  addRecipeToWeekPlan,
  removeRecipeFromWeekPlan,
  getRecipe
} from '@/lib/json-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId') || 'default-household';

    const weekPlan = getCurrentWeekPlan(householdId);

    if (!weekPlan) {
      return NextResponse.json({
        id: null,
        householdId,
        recipes: [],
        generatedGroceryList: []
      });
    }

    // Get full recipe details
    const recipesWithDetails = weekPlan.recipes.map(wr => {
      const recipe = getRecipe(wr.recipeId);
      return {
        ...wr,
        recipe
      };
    });

    return NextResponse.json({
      ...weekPlan,
      recipes: recipesWithDetails
    });
  } catch (error) {
    console.error('Week plan fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch week plan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId, householdId, userId, dayOfWeek, mealType } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const defaultHouseholdId = householdId || 'default-household';
    const defaultUserId = userId || 'default-user';
    const defaultDay = dayOfWeek || 'monday';
    const defaultMeal = mealType || 'dinner';

    const updatedPlan = addRecipeToWeekPlan(
      defaultHouseholdId,
      recipeId,
      defaultDay,
      defaultMeal,
      defaultUserId
    );

    // Get full recipe details
    const recipesWithDetails = updatedPlan.recipes.map(wr => {
      const recipe = getRecipe(wr.recipeId);
      return {
        ...wr,
        recipe
      };
    });

    return NextResponse.json({
      ...updatedPlan,
      recipes: recipesWithDetails
    });
  } catch (error) {
    console.error('Add recipe error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to add recipe to week plan';

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

    const updatedPlan = removeRecipeFromWeekPlan(defaultHouseholdId, recipeId);

    // Get full recipe details
    const recipesWithDetails = updatedPlan.recipes.map(wr => {
      const recipe = getRecipe(wr.recipeId);
      return {
        ...wr,
        recipe
      };
    });

    return NextResponse.json({
      ...updatedPlan,
      recipes: recipesWithDetails
    });
  } catch (error) {
    console.error('Remove recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to remove recipe from week plan' },
      { status: 500 }
    );
  }
}
