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

    // Build platform map like in apilo.js
    const platformMap = {};
    if (Array.isArray(platformMapRes.data)) {
      platformMapRes.data.forEach(p => {
        platformMap[p.id] = {
          name: p.description || p.name,
          platform: p.name
        };
      });
    }

    // Get one order to see structure
    let orderData = null;
    let mappedChannel = null;

    if (orderId) {
      // Get specific order
      const ordersRes = await axios.get(`${baseUrl}/rest/api/orders/?limit=100`, { headers });
      const orders = ordersRes.data?.orders || [];
      orderData = orders.find(o => o.id === orderId) || null;
    } else {
      const ordersRes = await axios.get(`${baseUrl}/rest/api/orders/?limit=1`, { headers });
      orderData = ordersRes.data?.orders?.[0] || null;
    }

    if (orderData) {
      const platformId = orderData.platformAccountId || orderData.platformId;
      const platformInfo = platformMap[platformId] || {};
      mappedChannel = {
        platformId,
        platformAccountId: orderData.platformAccountId,
        rawPlatformId: orderData.platformId,
        mappedLabel: platformInfo.name || `Platform ${platformId}`,
        mappedPlatform: platformInfo.platform || 'Unknown'
      };
    }

    return NextResponse.json({
      platformMapSample: Object.fromEntries(Object.entries(platformMap).slice(0, 10)),
      sampleOrder: orderData ? {
        id: orderData.id,
        platformId: orderData.platformId,
        platformAccountId: orderData.platformAccountId,
        allKeys: Object.keys(orderData)
      } : null,
      mappedChannel
    });
  } catch (error) {
    console.error('[Debug] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
