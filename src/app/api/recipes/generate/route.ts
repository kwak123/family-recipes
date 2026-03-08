import { NextRequest, NextResponse } from 'next/server';
import { generateRecipesWithGeminiStream } from '@/lib/ai-providers/gemini';
import { saveRecipes } from '@/lib/firestore-db';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences, favoriteIngredients, groceryIngredients, householdId, userId } = body;

    const defaultHouseholdId = householdId || 'default-household';
    const defaultUserId = userId || 'default-user';

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const recipe of generateRecipesWithGeminiStream(
            preferences || '',
            favoriteIngredients,
            groceryIngredients
          )) {
            const [saved] = await saveRecipes([{
              ...recipe,
              householdId: defaultHouseholdId,
              source: 'ai' as const,
              createdBy: defaultUserId,
              isArchived: false,
            }]);
            controller.enqueue(encoder.encode(JSON.stringify(saved) + '\n'));
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to generate recipes';
          controller.enqueue(encoder.encode(JSON.stringify({ error: msg }) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recipes' },
      { status: 500 }
    );
  }
}
