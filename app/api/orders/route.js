import { NextResponse } from 'next/server';
import { getOrders, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();
    const orders = await getOrders(10);

    return NextResponse.json({
      orders,
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
