import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();

    // Orders today by platform
    const todayByPlatform = await sql`
      SELECT channel_platform as platform, COUNT(*) as count
      FROM orders
      WHERE ordered_at >= CURRENT_DATE
      GROUP BY channel_platform
      ORDER BY count DESC
    `;

    // Orders last 30 days by platform
    const last30DaysByPlatform = await sql`
      SELECT channel_platform as platform, COUNT(*) as count
      FROM orders
      WHERE ordered_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY channel_platform
      ORDER BY count DESC
    `;

    // Orders today total
    const ordersToday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE ordered_at >= CURRENT_DATE
    `;

    // Orders yesterday total
    const ordersYesterday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE ordered_at >= CURRENT_DATE - INTERVAL '1 day'
        AND ordered_at < CURRENT_DATE
    `;

    // Shipped today (delivery_status = 13 means shipped)
    const shippedToday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE delivery_status = 13
        AND updated_at >= CURRENT_DATE
    `;

    // Shipped yesterday
    const shippedYesterday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE delivery_status = 13
        AND updated_at >= CURRENT_DATE - INTERVAL '1 day'
        AND updated_at < CURRENT_DATE
    `;

    // Total orders
    const totalOrders = await sql`
      SELECT COUNT(*) as count FROM orders
    `;

    return NextResponse.json({
      todayByPlatform: todayByPlatform.rows.map(r => ({
        platform: r.platform || 'Inne',
        count: parseInt(r.count)
      })),
      last30DaysByPlatform: last30DaysByPlatform.rows.map(r => ({
        platform: r.platform || 'Inne',
        count: parseInt(r.count)
      })),
      summary: {
        ordersToday: parseInt(ordersToday.rows[0].count),
        ordersYesterday: parseInt(ordersYesterday.rows[0].count),
        shippedToday: parseInt(shippedToday.rows[0].count),
        shippedYesterday: parseInt(shippedYesterday.rows[0].count),
        totalOrders: parseInt(totalOrders.rows[0].count)
      }
    });
  } catch (error) {
    console.error('[API] Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
