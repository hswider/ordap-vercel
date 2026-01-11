import { NextResponse } from 'next/server';
import axios from 'axios';
import { getTokens, initDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await initDatabase();
    const tokens = await getTokens();

    if (!tokens?.access_token) {
      return NextResponse.json({ error: 'No tokens' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const headers = {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const baseUrl = process.env.APILO_BASE_URL;

    // Get platform map
    const platformMapRes = await axios.get(`${baseUrl}/rest/api/orders/platform/map/`, { headers });

    // Get one order to see structure
    let orderData = null;
    if (orderId) {
      const orderRes = await axios.get(`${baseUrl}/rest/api/orders/${orderId}/`, { headers });
      orderData = orderRes.data;
    } else {
      const ordersRes = await axios.get(`${baseUrl}/rest/api/orders/?limit=1`, { headers });
      orderData = ordersRes.data?.orders?.[0] || null;
    }

    return NextResponse.json({
      platformMap: platformMapRes.data,
      sampleOrder: orderData,
      platformMapKeys: Object.keys(platformMapRes.data || {}),
      orderKeys: orderData ? Object.keys(orderData) : []
    });
  } catch (error) {
    console.error('[Debug] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
