import { NextRequest, NextResponse } from 'next/server';
import { getCurrentMealPlan, updateGroceryItemChecked } from '@/lib/firestore-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId') || 'default-household';

    const mealPlan = await getCurrentMealPlan(householdId);

    if (!mealPlan) {
      return NextResponse.json([]);
    }

    return NextResponse.json(mealPlan.generatedGroceryList);
  } catch (error) {
    console.error('Grocery list error:', error);
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { itemName, checked, householdId } = await request.json();
    const hid = householdId || 'default-household';
    const mealPlan = await updateGroceryItemChecked(hid, itemName, checked);
    return NextResponse.json(mealPlan.generatedGroceryList);
  } catch (error) {
    console.error('Grocery check error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
