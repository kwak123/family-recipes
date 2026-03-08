import { NextRequest, NextResponse } from 'next/server';
import { parseRecipeFromUrl } from '@/lib/ai-providers/gemini';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json() as { url: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let pageText: string;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeImporter/1.0)' },
      });
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: HTTP ${response.status}` },
          { status: 400 }
        );
      }
      const html = await response.text();
      pageText = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000);
    } catch {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const recipe = await parseRecipeFromUrl(pageText);
    if (!recipe) {
      return NextResponse.json(
        { error: 'Could not parse a recipe from this URL' },
        { status: 422 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Import URL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import recipe' },
      { status: 500 }
    );
  }
}
