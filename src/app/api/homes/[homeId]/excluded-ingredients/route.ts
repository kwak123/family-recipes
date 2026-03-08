import { NextRequest, NextResponse } from 'next/server';
import {
  addExcludedIngredient,
  removeExcludedIngredient,
  getHousehold,
  getUser
} from '@/lib/firestore-db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { homeId } = await params;
    
    // Validate authorization
    const user = await getUser(session.user.id);
    const activeHomeId = user?.currentHomeId || 'default-household';
    if (!user || activeHomeId !== homeId) {
        return NextResponse.json({ error: 'Unauthorized or invalid home access' }, { status: 403 });
    }

    const body = await request.json();
    const { ingredient } = body;

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient is required' },
        { status: 400 }
      );
    }

    const household = await addExcludedIngredient(homeId, ingredient);

    return NextResponse.json({
      success: true,
      excludedIngredients: household.excludedIngredients || []
    });
  } catch (error) {
    console.error('Add excluded ingredient error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to add excluded ingredient';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { homeId } = await params;
    
    // Validate authorization
    const user = await getUser(session.user.id);
    const activeHomeId = user?.currentHomeId || 'default-household';
    if (!user || activeHomeId !== homeId) {
        return NextResponse.json({ error: 'Unauthorized or invalid home access' }, { status: 403 });
    }

    const body = await request.json();
    const { ingredient } = body;

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient is required' },
        { status: 400 }
      );
    }

    const household = await removeExcludedIngredient(homeId, ingredient);

    return NextResponse.json({
      success: true,
      excludedIngredients: household.excludedIngredients || []
    });
  } catch (error) {
    console.error('Remove excluded ingredient error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to remove excluded ingredient';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { homeId } = await params;
    
    // Validate authorization
    const user = await getUser(session.user.id);
    const activeHomeId = user?.currentHomeId || 'default-household';
    if (!user || activeHomeId !== homeId) {
        return NextResponse.json({ error: 'Unauthorized or invalid home access' }, { status: 403 });
    }

    const household = await getHousehold(homeId);

    if (!household) {
      return NextResponse.json({
        excludedIngredients: []
      });
    }

    return NextResponse.json({
      excludedIngredients: household.excludedIngredients || []
    });
  } catch (error) {
    console.error('Get excluded ingredients error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch excluded ingredients' },
      { status: 500 }
    );
  }
}
