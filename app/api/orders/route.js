import { NextResponse } from 'next/server';
import { getOrders, initDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    // Get pagination params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const perPage = parseInt(searchParams.get('perPage')) || 20;

    const result = await getOrders(page, perPage);

    return NextResponse.json({
      ...result,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
