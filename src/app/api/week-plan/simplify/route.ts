import { NextRequest, NextResponse } from 'next/server';
import { simplifyMealPlanWithGemini } from '@/lib/ai-providers/gemini';
import { updateRecipe, regenerateWeekPlanGroceryList } from '@/lib/firestore-db';
import { Recipe } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { recipes } = await request.json() as { recipes: Recipe[] };

    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: 'No recipes provided' }, { status: 400 });
    }

    const simplified = await simplifyMealPlanWithGemini(recipes);
    return NextResponse.json({ recipes: simplified });
  } catch (error) {
    console.error('Simplify error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to simplify' },
      { status: 500 }
    );
  }
}

// Commit simplified recipes to Firestore and regenerate grocery list
export async function PATCH(request: NextRequest) {
  try {
    const { recipes, householdId } = await request.json() as { recipes: Recipe[]; householdId?: string };
    const hid = householdId || 'default-household';

    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: 'No recipes provided' }, { status: 400 });
    }

    // Update each recipe in Firestore with the simplified version
    const updated = await Promise.all(
      recipes.map(r => updateRecipe(r.id, {
        description: r.description,
        cookTimeMinutes: r.cookTimeMinutes,
        servings: r.servings,
        ingredients: r.ingredients,
        instructions: r.instructions,
        tags: r.tags,
      }))
    );

    // Regenerate the grocery list now that ingredients have changed
    await regenerateWeekPlanGroceryList(hid);

    return NextResponse.json({ recipes: updated });
  } catch (error) {
    console.error('Commit simplified error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to commit' },
      { status: 500 }
    );
  }
}
