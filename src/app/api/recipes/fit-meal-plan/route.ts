import { NextRequest, NextResponse } from 'next/server';
import { fitRecipeToMealPlan } from '@/lib/ai-providers/gemini';
import { Recipe } from '@/lib/types';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { recipe, mealPlanRecipes } = await request.json() as {
      recipe: Recipe;
      mealPlanRecipes: Recipe[];
    };

    if (!recipe || !Array.isArray(mealPlanRecipes)) {
      return NextResponse.json(
        { error: 'recipe and mealPlanRecipes are required' },
        { status: 400 }
      );
    }

    const fittedIngredients = await fitRecipeToMealPlan(recipe, mealPlanRecipes);
    return NextResponse.json({ fittedIngredients });
  } catch (error) {
    console.error('Fit meal plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fit recipe' },
      { status: 500 }
    );
  }
}
