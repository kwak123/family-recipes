import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWeekPlan } from '@/lib/json-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId') || 'default-household';

    const weekPlan = getCurrentWeekPlan(householdId);

    if (!weekPlan) {
      return NextResponse.json([]);
    }

    return NextResponse.json(weekPlan.generatedGroceryList);
  } catch (error) {
    console.error('Grocery list error:', error);
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    );
  }
}
