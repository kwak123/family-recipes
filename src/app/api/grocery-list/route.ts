import { NextResponse } from 'next/server';
import { getWeekPlan, getRecipesByIds } from '@/lib/db';
import { aggregateIngredients } from '@/utils/grocery';

export async function GET() {
  try {
    const weekPlan = getWeekPlan();
    const recipes = getRecipesByIds(weekPlan.recipeIds);
    const groceryList = aggregateIngredients(recipes);

    return NextResponse.json(groceryList);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    );
  }
}
