import { NextRequest, NextResponse } from 'next/server';
import { generateRecipesWithGemini } from '@/lib/ai-providers/gemini';
import { saveRecipes } from '@/lib/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences, favoriteIngredients, householdId, userId } = body;

    // For now, use default household if not provided
    const defaultHouseholdId = householdId || 'default-household';
    const defaultUserId = userId || 'default-user';

    // Generate recipes using Google Gemini AI
    const aiRecipes = await generateRecipesWithGemini(
      preferences || '',
      favoriteIngredients
    );

    // Save recipes to database
    const recipesToSave = aiRecipes.map(recipe => ({
      ...recipe,
      householdId: defaultHouseholdId,
      source: 'ai' as const,
      createdBy: defaultUserId,
      isArchived: false
    }));

    const savedRecipes = saveRecipes(recipesToSave);

    return NextResponse.json(savedRecipes);
  } catch (error) {
    console.error('Recipe generation error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to generate recipes';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
