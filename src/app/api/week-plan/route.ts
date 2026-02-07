import { NextRequest, NextResponse } from 'next/server';
import {
  getWeekPlan,
  addToWeekPlan,
  removeFromWeekPlan,
  getRecipesByIds
} from '@/lib/db';

export async function GET() {
  try {
    const weekPlan = getWeekPlan();
    const recipes = getRecipesByIds(weekPlan.recipeIds);

    return NextResponse.json({
      ...weekPlan,
      recipes
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch week plan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const updatedPlan = addToWeekPlan(recipeId);
    const recipes = getRecipesByIds(updatedPlan.recipeIds);

    return NextResponse.json({
      ...updatedPlan,
      recipes
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add recipe to week plan';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const updatedPlan = removeFromWeekPlan(recipeId);
    const recipes = getRecipesByIds(updatedPlan.recipeIds);

    return NextResponse.json({
      ...updatedPlan,
      recipes
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove recipe from week plan' },
      { status: 500 }
    );
  }
}
