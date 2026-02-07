import { NextResponse } from 'next/server';
import { purgeDatabase, getDatabaseStats } from '@/lib/json-db';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Purge is only available in development' },
      { status: 403 }
    );
  }

  try {
    purgeDatabase();

    return NextResponse.json({
      message: 'Database purged successfully',
      stats: getDatabaseStats()
    });
  } catch (error) {
    console.error('Purge error:', error);
    return NextResponse.json(
      { error: 'Failed to purge database' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = getDatabaseStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get database stats' },
      { status: 500 }
    );
  }
}
