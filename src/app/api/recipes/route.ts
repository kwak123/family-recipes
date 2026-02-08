import { NextRequest, NextResponse } from 'next/server';
import { getRecipesByHousehold } from '@/lib/json-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId') || 'default-household';

    const recipes = getRecipesByHousehold(householdId, false);

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Get recipes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
