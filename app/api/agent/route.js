import { NextResponse } from 'next/server';
import {
  getStatsForDateRange,
  getStatsByPlatform,
  getDailyStats,
  getTopProducts,
  getOverallStats,
  getStatusDistribution
} from '@/lib/db';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Currency conversion
const EUR_TO_PLN = 4.35;

// Helper to get date ranges
function getDateRanges() {
  const now = new Date();

  // Today (start of day to now)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Yesterday
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart);

  // This week (Monday to now)
  const weekStart = new Date(todayStart);
  const dayOfWeek = weekStart.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - diff);

  // Last 7 days
  const last7Start = new Date(todayStart);
  last7Start.setDate(last7Start.getDate() - 7);

  // Last 30 days
  const last30Start = new Date(todayStart);
  last30Start.setDate(last30Start.getDate() - 30);

  // This month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    now,
    todayStart,
    yesterdayStart,
    yesterdayEnd,
    weekStart,
    last7Start,
    last30Start,
    monthStart,
    lastMonthStart,
    lastMonthEnd
  };
}

// Gather context data for AI
async function gatherContextData() {
  const dates = getDateRanges();

  try {
    const [
      todayStats,
      yesterdayStats,
      last7DaysStats,
      last30DaysStats,
      thisMonthStats,
      lastMonthStats,
      todayByPlatform,
      last7DaysByPlatform,
      dailyStats,
      topProducts,
      overallStats,
      statusDistribution
    ] = await Promise.all([
      getStatsForDateRange(dates.todayStart, dates.now),
      getStatsForDateRange(dates.yesterdayStart, dates.yesterdayEnd),
      getStatsForDateRange(dates.last7Start, dates.now),
      getStatsForDateRange(dates.last30Start, dates.now),
      getStatsForDateRange(dates.monthStart, dates.now),
      getStatsForDateRange(dates.lastMonthStart, dates.lastMonthEnd),
      getStatsByPlatform(dates.todayStart, dates.now),
      getStatsByPlatform(dates.last7Start, dates.now),
      getDailyStats(dates.last30Start, dates.now),
      getTopProducts(dates.last30Start, dates.now, 10),
      getOverallStats(),
      getStatusDistribution()
    ]);

    return {
      currentDate: dates.now.toISOString().split('T')[0],
      today: {
        orders: parseInt(todayStats.order_count) || 0,
        revenue: parseFloat(todayStats.total_revenue) || 0,
        avgOrderValue: parseFloat(todayStats.avg_order_value) || 0,
        byPlatform: todayByPlatform.map(p => ({
          platform: p.channel_platform,
          orders: parseInt(p.order_count) || 0,
          revenue: parseFloat(p.total_revenue) || 0
        }))
      },
      yesterday: {
        orders: parseInt(yesterdayStats.order_count) || 0,
        revenue: parseFloat(yesterdayStats.total_revenue) || 0,
        avgOrderValue: parseFloat(yesterdayStats.avg_order_value) || 0
      },
      last7Days: {
        orders: parseInt(last7DaysStats.order_count) || 0,
        revenue: parseFloat(last7DaysStats.total_revenue) || 0,
        avgOrderValue: parseFloat(last7DaysStats.avg_order_value) || 0,
        byPlatform: last7DaysByPlatform.map(p => ({
          platform: p.channel_platform,
          orders: parseInt(p.order_count) || 0,
          revenue: parseFloat(p.total_revenue) || 0
        }))
      },
      last30Days: {
        orders: parseInt(last30DaysStats.order_count) || 0,
        revenue: parseFloat(last30DaysStats.total_revenue) || 0,
        avgOrderValue: parseFloat(last30DaysStats.avg_order_value) || 0,
        dailyBreakdown: dailyStats.slice(0, 14).map(d => ({
          date: d.date,
          orders: parseInt(d.order_count) || 0,
          revenue: parseFloat(d.total_revenue) || 0
        }))
      },
      thisMonth: {
        orders: parseInt(thisMonthStats.order_count) || 0,
        revenue: parseFloat(thisMonthStats.total_revenue) || 0
      },
      lastMonth: {
        orders: parseInt(lastMonthStats.order_count) || 0,
        revenue: parseFloat(lastMonthStats.total_revenue) || 0
      },
      topProducts: topProducts.map(p => ({
        name: p.product_name,
        sku: p.sku,
        quantity: parseInt(p.total_quantity) || 0,
        orders: parseInt(p.order_count) || 0
      })),
      overall: {
        totalOrders: parseInt(overallStats.total_orders) || 0,
        totalRevenue: parseFloat(overallStats.total_revenue) || 0,
        avgOrderValue: parseFloat(overallStats.avg_order_value) || 0,
        platformCount: parseInt(overallStats.platform_count) || 0,
        canceledOrders: parseInt(overallStats.canceled_orders) || 0
      },
      conversionRate: EUR_TO_PLN
    };
  } catch (error) {
    console.error('[Agent] Error gathering context:', error);
    return null;
  }
}

// Call Groq API (free and fast)
async function callGroq(message, contextData) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY nie jest skonfigurowany. Dodaj go do zmiennych środowiskowych w Vercel.');
  }

  const systemPrompt = `Jesteś asystentem AI dla systemu zarządzania zamówieniami POOM. Odpowiadasz po polsku na pytania dotyczące sprzedaży, zamówień i statystyk.

WAŻNE ZASADY:
- Odpowiadaj krótko i konkretnie
- Używaj polskich nazw i formatowania walut (np. "1 234,56 PLN")
- Kwoty w bazie są przeważnie w EUR, kurs EUR/PLN: ${EUR_TO_PLN}
- Przy podawaniu kwot w PLN, przeliczaj z EUR i zaznacz to
- Jeśli nie masz danych na dane pytanie, powiedz o tym wprost
- Formatuj liczby z separatorami tysięcy
- Używaj emoji sparingly dla czytelności

AKTUALNE DANE (stan na ${contextData?.currentDate || 'teraz'}):

DZISIAJ:
- Zamówień: ${contextData?.today?.orders || 0}
- Obrót: ${contextData?.today?.revenue?.toFixed(2) || 0} EUR (≈ ${((contextData?.today?.revenue || 0) * EUR_TO_PLN).toFixed(2)} PLN)
- Średnia wartość: ${contextData?.today?.avgOrderValue?.toFixed(2) || 0} EUR

WCZORAJ:
- Zamówień: ${contextData?.yesterday?.orders || 0}
- Obrót: ${contextData?.yesterday?.revenue?.toFixed(2) || 0} EUR (≈ ${((contextData?.yesterday?.revenue || 0) * EUR_TO_PLN).toFixed(2)} PLN)

OSTATNIE 7 DNI:
- Zamówień: ${contextData?.last7Days?.orders || 0}
- Obrót: ${contextData?.last7Days?.revenue?.toFixed(2) || 0} EUR (≈ ${((contextData?.last7Days?.revenue || 0) * EUR_TO_PLN).toFixed(2)} PLN)

OSTATNIE 30 DNI:
- Zamówień: ${contextData?.last30Days?.orders || 0}
- Obrót: ${contextData?.last30Days?.revenue?.toFixed(2) || 0} EUR (≈ ${((contextData?.last30Days?.revenue || 0) * EUR_TO_PLN).toFixed(2)} PLN)

TEN MIESIĄC:
- Zamówień: ${contextData?.thisMonth?.orders || 0}
- Obrót: ${contextData?.thisMonth?.revenue?.toFixed(2) || 0} EUR

POPRZEDNI MIESIĄC:
- Zamówień: ${contextData?.lastMonth?.orders || 0}
- Obrót: ${contextData?.lastMonth?.revenue?.toFixed(2) || 0} EUR

PLATFORMY (ostatnie 7 dni):
${contextData?.last7Days?.byPlatform?.map(p => `- ${p.platform}: ${p.orders} zamówień, ${p.revenue?.toFixed(2)} EUR`).join('\n') || 'Brak danych'}

DZIENNE STATYSTYKI (ostatnie 14 dni):
${contextData?.last30Days?.dailyBreakdown?.map(d => `- ${d.date}: ${d.orders} zam., ${d.revenue?.toFixed(2)} EUR`).join('\n') || 'Brak danych'}

TOP 10 PRODUKTÓW (ostatnie 30 dni):
${contextData?.topProducts?.map((p, i) => `${i+1}. ${p.name} (${p.sku || 'brak SKU'}): ${p.quantity} szt. w ${p.orders} zamówieniach`).join('\n') || 'Brak danych'}

OGÓLNE STATYSTYKI:
- Wszystkie zamówienia: ${contextData?.overall?.totalOrders || 0}
- Całkowity obrót: ${contextData?.overall?.totalRevenue?.toFixed(2) || 0} EUR
- Anulowane: ${contextData?.overall?.canceledOrders || 0}
- Liczba platform: ${contextData?.overall?.platformCount || 0}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Groq API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Brak odpowiedzi';
}

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Brak wiadomości' },
        { status: 400 }
      );
    }

    console.log('[Agent] Received question:', message);

    // Gather context data from database
    const contextData = await gatherContextData();

    if (!contextData) {
      return NextResponse.json(
        { error: 'Nie udało się pobrać danych z bazy' },
        { status: 500 }
      );
    }

    // Call Groq (free API)
    const aiResponse = await callGroq(message, contextData);

    console.log('[Agent] Response generated successfully');

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd' },
      { status: 500 }
    );
  }
}
