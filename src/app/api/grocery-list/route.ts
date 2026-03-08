import { NextRequest, NextResponse } from 'next/server';
import { getCurrentMealPlan, updateGroceryItemChecked, getUser } from '@/lib/firestore-db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session.user.id);
    const householdId = user?.currentHomeId || 'default-household';

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session.user.id);
    const hid = user?.currentHomeId || 'default-household';

    const { itemName, checked } = await request.json();
    const mealPlan = await updateGroceryItemChecked(hid, itemName, checked);
    return NextResponse.json(mealPlan.generatedGroceryList);
  } catch (error) {
    console.error('Grocery check error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
