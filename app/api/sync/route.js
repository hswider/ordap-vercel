import { NextResponse } from 'next/server';
import { initDatabase, saveOrders } from '@/lib/db';
import { fetchOrders } from '@/lib/apilo';

export async function GET(request) {
  // Verify cron secret for security (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without auth in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('[Sync] Starting synchronization...');

    await initDatabase();
    const orders = await fetchOrders(10);
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

// Also allow POST for manual sync from frontend
export async function POST(request) {
  return GET(request);
}
