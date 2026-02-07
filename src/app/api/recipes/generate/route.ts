import { NextRequest, NextResponse } from 'next/server';
import { getGeneratedRecipes } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences } = body;

    const recipes = getGeneratedRecipes(preferences || '');

    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate recipes' },
      { status: 500 }
    );
  }
}
