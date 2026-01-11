import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

// Kurs wymiany EUR -> PLN (przybliżony)
const EUR_TO_PLN = 4.35;

function convertToPln(amount, currency) {
  if (!amount) return 0;
  if (currency === 'PLN') return parseFloat(amount);
  if (currency === 'EUR') return parseFloat(amount) * EUR_TO_PLN;
  // Dla innych walut zakładamy EUR i przeliczamy na PLN
  return parseFloat(amount) * EUR_TO_PLN;
}

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

    // Revenue today by currency
    const revenueToday = await sql`
      SELECT currency, SUM(total_gross) as total
      FROM orders
      WHERE ordered_at >= CURRENT_DATE
      GROUP BY currency
    `;

    // Revenue last 30 days by currency
    const revenue30Days = await sql`
      SELECT currency, SUM(total_gross) as total
      FROM orders
      WHERE ordered_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY currency
    `;

    // Revenue last 7 days by day
    const revenueLast7Days = await sql`
      SELECT
        DATE(ordered_at) as date,
        currency,
        SUM(total_gross) as total
      FROM orders
      WHERE ordered_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(ordered_at), currency
      ORDER BY date ASC
    `;

    // Calculate revenue in PLN
    let revenueTodayPln = 0;
    revenueToday.rows.forEach(r => {
      revenueTodayPln += convertToPln(r.total, r.currency);
    });

    let revenue30DaysPln = 0;
    revenue30Days.rows.forEach(r => {
      revenue30DaysPln += convertToPln(r.total, r.currency);
    });

    // Build daily revenue chart data
    const dailyRevenueMap = {};
    revenueLast7Days.rows.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (!dailyRevenueMap[dateStr]) {
        dailyRevenueMap[dateStr] = 0;
      }
      dailyRevenueMap[dateStr] += convertToPln(r.total, r.currency);
    });

    // Create array for last 7 days
    const last7DaysRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short' });
      last7DaysRevenue.push({
        date: dateStr,
        day: dayName,
        revenue: Math.round(dailyRevenueMap[dateStr] || 0)
      });
    }

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
      },
      revenue: {
        todayPln: Math.round(revenueTodayPln),
        last30DaysPln: Math.round(revenue30DaysPln),
        last7Days: last7DaysRevenue
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
