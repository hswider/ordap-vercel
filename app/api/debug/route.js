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
    const checkOrderId = searchParams.get('orderId');

    const headers = {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const baseUrl = process.env.APILO_BASE_URL;

    // If specific order requested, fetch it
    if (checkOrderId) {
      try {
        const orderRes = await axios.get(`${baseUrl}/rest/api/orders/${checkOrderId}/`, { headers });
        const platformMapRes = await axios.get(`${baseUrl}/rest/api/orders/platform/map/`, { headers });

        const platformMap = {};
        if (Array.isArray(platformMapRes.data)) {
          platformMapRes.data.forEach(p => {
            platformMap[p.id] = {
              name: p.description || p.name,
              platform: p.name
            };
          });
        }

        const order = orderRes.data;
        const platformId = order.platformAccountId || order.platformId;
        const platformInfo = platformMap[platformId];

        return NextResponse.json({
          orderId: checkOrderId,
          found: true,
          rawOrder: {
            id: order.id,
            platformAccountId: order.platformAccountId,
            platformId: order.platformId,
            orderedAt: order.orderedAt
          },
          platformMapping: {
            lookupKey: platformId,
            platformInfo,
            mappedLabel: platformInfo?.name || `Platform ${platformId}`
          }
        });
      } catch (e) {
        return NextResponse.json({
          orderId: checkOrderId,
          found: false,
          error: e.message,
          apiError: e.response?.data
        });
      }
    }

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

    // Get newest orders
    const ordersRes = await axios.get(`${baseUrl}/rest/api/orders/?limit=10&sort=orderedAtDesc`, { headers });
    const orders = ordersRes.data?.orders || [];

    // Show the 3 newest orders with full details
    const newestOrders = orders.slice(0, 3).map(o => {
      const platformId = o.platformAccountId || o.platformId;
      const platformInfo = platformMap[platformId];
      return {
        id: o.id,
        platformAccountId: o.platformAccountId,
        platformIdType: typeof o.platformAccountId,
        lookupKey: platformId,
        lookupKeyType: typeof platformId,
        platformInfoFound: !!platformInfo,
        platformInfo,
        finalLabel: platformInfo?.name || `Platform ${platformId}`,
        orderedAt: o.orderedAt
      };
    });

    // Find orders with different platforms (especially Amazon)
    const amazonOrders = orders.filter(o => o.platformAccountId >= 100).slice(0, 5);
    const allegroOrders = orders.filter(o => o.platformAccountId < 100).slice(0, 3);

    const debugOrders = [...amazonOrders, ...allegroOrders].map(o => {
      const platformId = o.platformAccountId || o.platformId;
      const platformInfo = platformMap[platformId];
      return {
        id: o.id,
        platformAccountId: o.platformAccountId,
        platformId: o.platformId,
        platformIdType: typeof o.platformAccountId,
        mapKeyExists: platformId in platformMap,
        platformInfo: platformInfo || null,
        mappedLabel: platformInfo?.name || `Platform ${platformId}`,
        mappedPlatform: platformInfo?.platform || 'Unknown'
      };
    });

    // Show available platform IDs >= 100 (Amazon range)
    const amazonPlatforms = Object.entries(platformMap)
      .filter(([id]) => parseInt(id) >= 100)
      .slice(0, 10)
      .reduce((acc, [id, val]) => { acc[id] = val; return acc; }, {});

    return NextResponse.json({
      totalPlatforms: Object.keys(platformMap).length,
      newestOrders,
      amazonPlatforms,
      debugOrders,
      rawPlatformMapSample: platformMapRes.data?.slice(0, 3)
    });
  } catch (error) {
    console.error('[Debug] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
