import { NextRequest, NextResponse } from 'next/server';
import { saveRecipes, addRecipeToMealPlan, getRecipe } from '@/lib/firestore-db';
import { Recipe } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { recipe, householdId, userId } = await request.json() as {
      recipe: Recipe;
      householdId?: string;
      userId?: string;
    };

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe is required' }, { status: 400 });
    }

    const hid = householdId || 'default-household';
    const uid = userId || 'default-user';

    const [saved] = await saveRecipes([{
      id: recipe.id || 'imported',
      name: recipe.name,
      description: recipe.description,
      cookTimeMinutes: recipe.cookTimeMinutes,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: recipe.tags,
      householdId: hid,
      source: 'ai' as const,
      createdBy: uid,
      isArchived: false,
    }]);

    const updatedPlan = await addRecipeToMealPlan(hid, saved.id, 'monday', 'dinner', uid);

    const recipesWithDetails = await Promise.all(
      updatedPlan.recipes.map(async wr => {
        const r = await getRecipe(wr.recipeId);
        return { ...wr, recipe: r };
      })
    );

    return NextResponse.json({ ...updatedPlan, recipes: recipesWithDetails });
  } catch (error) {
    console.error('Meal plan import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import recipe' },
      { status: 500 }
    );
  }
}
