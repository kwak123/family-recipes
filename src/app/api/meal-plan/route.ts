import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentMealPlan,
  addRecipeToMealPlan,
  removeRecipeFromMealPlan,
  getRecipe
} from '@/lib/firestore-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId') || 'default-household';

    const mealPlan = await getCurrentMealPlan(householdId);

    if (!mealPlan) {
      return NextResponse.json({
        id: null,
        householdId,
        recipes: [],
        generatedGroceryList: []
      });
    }

    // Get full recipe details
    const recipesWithDetails = await Promise.all(
      mealPlan.recipes.map(async wr => {
        const recipe = await getRecipe(wr.recipeId);
        return { ...wr, recipe };
      })
    );

    return NextResponse.json({
      ...mealPlan,
      recipes: recipesWithDetails
    });
  } catch (error) {
    console.error('Meal plan fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
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

    const updatedPlan = await addRecipeToMealPlan(
      defaultHouseholdId,
      recipeId,
      defaultDay,
      defaultMeal,
      defaultUserId
    );

    // Get full recipe details
    const recipesWithDetails = await Promise.all(
      updatedPlan.recipes.map(async wr => {
        const recipe = await getRecipe(wr.recipeId);
        return { ...wr, recipe };
      })
    );

    return NextResponse.json({
      ...updatedPlan,
      recipes: recipesWithDetails
    });
  } catch (error) {
    console.error('Add recipe error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to add recipe to meal plan';

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

    const updatedPlan = await removeRecipeFromMealPlan(defaultHouseholdId, recipeId);

    // Get full recipe details
    const recipesWithDetails = await Promise.all(
      updatedPlan.recipes.map(async wr => {
        const recipe = await getRecipe(wr.recipeId);
        return { ...wr, recipe };
      })
    );

    return NextResponse.json({
      ...updatedPlan,
      recipes: recipesWithDetails
    });
  } catch (error) {
    console.error('Remove recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to remove recipe from meal plan' },
      { status: 500 }
    );
  }
}
