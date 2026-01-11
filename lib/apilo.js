import axios from 'axios';
import { getTokens, saveTokens } from './db';

const APILO_BASE_URL = process.env.APILO_BASE_URL;
const APILO_CLIENT_ID = process.env.APILO_CLIENT_ID;
const APILO_CLIENT_SECRET = process.env.APILO_CLIENT_SECRET;

// Platform maps cache
let platformMap = {};
let paymentMap = {};

async function refreshTokens(refreshToken) {
  const credentials = Buffer.from(`${APILO_CLIENT_ID}:${APILO_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    `${APILO_BASE_URL}/rest/auth/token/`,
    { grantType: 'refresh_token', token: refreshToken },
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  const { accessToken, refreshToken: newRefreshToken, accessTokenExpireAt } = response.data;
  const expiresAt = accessTokenExpireAt
    ? new Date(accessTokenExpireAt).getTime() - 60000
    : Date.now() + 3600000;

  await saveTokens(accessToken, newRefreshToken, expiresAt);
  console.log('[Apilo] Tokens refreshed');

  return accessToken;
}

async function getAccessToken() {
  const tokens = await getTokens();

  if (!tokens || !tokens.access_token) {
    throw new Error('No tokens found. Please set initial tokens in database.');
  }

  // Check if token is still valid
  if (tokens.expires_at && Date.now() < parseInt(tokens.expires_at)) {
    return tokens.access_token;
  }

  // Refresh token
  if (tokens.refresh_token) {
    return await refreshTokens(tokens.refresh_token);
  }

  throw new Error('Cannot refresh token - no refresh token available');
}

async function apiloRequest(method, endpoint, data = null) {
  const token = await getAccessToken();

  const config = {
    method,
    url: `${APILO_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Try to refresh and retry
      const tokens = await getTokens();
      if (tokens?.refresh_token) {
        const newToken = await refreshTokens(tokens.refresh_token);
        config.headers['Authorization'] = `Bearer ${newToken}`;
        const response = await axios(config);
        return response.data;
      }
    }
    throw error;
  }
}

async function loadMaps() {
  if (Object.keys(platformMap).length === 0) {
    try {
      const [platforms, payments] = await Promise.all([
        apiloRequest('GET', '/rest/api/orders/platform/map/'),
        apiloRequest('GET', '/rest/api/orders/payment/map/')
      ]);
      platformMap = platforms || {};
      paymentMap = payments || {};
      console.log('[Apilo] Maps loaded:', Object.keys(platformMap).length, 'platforms');
    } catch (error) {
      console.error('[Apilo] Failed to load maps:', error.message);
    }
  }
}

function mapOrderToDTO(order) {
  const items = (order.orderItems || []).map(item => ({
    name: item.originalName || 'Unknown',
    sku: item.sku || '',
    quantity: item.quantity || 1,
    priceGross: parseFloat(item.originalPriceWithTax) || 0,
    totalGross: (parseFloat(item.originalPriceWithTax) || 0) * (item.quantity || 1),
    image: item.media || null,
    isShipping: item.type === 2
  }));

  const totalGross = items.reduce((sum, item) => sum + item.totalGross, 0);
  const platformId = order.platformAccountId || order.platformId;
  const platformInfo = platformMap[platformId] || {};

  return {
    id: String(order.id),
    externalId: order.idExternal || null,
    channel: {
      label: platformInfo.name || `Platform ${platformId}`,
      platform: platformInfo.platform || 'Unknown'
    },
    dates: {
      orderedAt: order.orderedAt || order.createdAt || null,
      updatedAt: order.updatedAt || null,
      shippingDate: order.shippingDate || null
    },
    status: {
      paymentStatus: order.paymentStatus >= 2 ? 'PAID' : 'UNPAID',
      deliveryStatus: order.status || null
    },
    financials: {
      totalGross,
      currency: order.originalCurrency || 'PLN',
      paidAmount: order.paymentStatus >= 2 ? totalGross : 0
    },
    items
  };
}

export async function fetchOrders(limit = 10) {
  await loadMaps();

  const data = await apiloRequest('GET', `/rest/api/orders/?limit=${limit}&sort=updatedAtDesc`);
  const orders = data?.orders || [];

  console.log('[Apilo] Fetched', orders.length, 'orders');

  return orders.map(order => mapOrderToDTO(order));
}
