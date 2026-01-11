import { NextResponse } from 'next/server';
import { initDatabase, saveOrders } from '@/lib/db';
import { fetchOrders } from '@/lib/apilo';

export async function GET(request) {
  // Verify cron secret for security (optional)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      // Allow without auth if no secret is set
    }
  }

  try {
    console.log('[Sync] Starting synchronization...');

    await initDatabase();

    // Fetch more orders (100 instead of 10)
    const orders = await fetchOrders(100, 0);
    await saveOrders(orders);

    console.log('[Sync] Saved', orders.length, 'orders');

    return NextResponse.json({
      success: true,
      count: orders.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
