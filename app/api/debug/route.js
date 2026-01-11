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
    const checkPlatformId = searchParams.get('platformId');

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

    // Check specific platformId if requested
    let specificPlatform = null;
    if (checkPlatformId) {
      specificPlatform = platformMap[checkPlatformId] || null;
    }

    // Get sample orders with different platforms
    const ordersRes = await axios.get(`${baseUrl}/rest/api/orders/?limit=20`, { headers });
    const orders = ordersRes.data?.orders || [];

    const orderSamples = orders.slice(0, 5).map(o => ({
      id: o.id,
      platformAccountId: o.platformAccountId,
      mappedTo: platformMap[o.platformAccountId] || { name: `Platform ${o.platformAccountId}`, platform: 'Unknown' }
    }));

    return NextResponse.json({
      totalPlatforms: Object.keys(platformMap).length,
      platform121: platformMap[121] || 'NOT FOUND',
      platform124: platformMap[124] || 'NOT FOUND',
      platform127: platformMap[127] || 'NOT FOUND',
      specificPlatform,
      orderSamples
    });
  } catch (error) {
    console.error('[Debug] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
