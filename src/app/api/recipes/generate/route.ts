import { NextRequest, NextResponse } from 'next/server';
import { generateRecipesWithGeminiStream } from '@/lib/ai-providers/gemini';
import { saveRecipes, getUser } from '@/lib/firestore-db';
import { auth } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session.user.id);
    const defaultHouseholdId = user?.currentHomeId || 'default-household';
    const defaultUserId = session.user.id;

    const body = await request.json();
    const { preferences, favoriteIngredients, groceryIngredients, selectedTags, excludeIngredients } = body;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const recipe of generateRecipesWithGeminiStream(
            preferences || '',
            favoriteIngredients,
            groceryIngredients,
            selectedTags,
            excludeIngredients
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
