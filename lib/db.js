import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(20) PRIMARY KEY,
      external_id VARCHAR(100),
      channel_label VARCHAR(255),
      channel_platform VARCHAR(100),
      ordered_at TIMESTAMP,
      updated_at TIMESTAMP,
      shipping_date TIMESTAMP,
      payment_status VARCHAR(20),
      delivery_status INTEGER,
      total_gross DECIMAL(10,2),
      currency VARCHAR(3),
      paid_amount DECIMAL(10,2),
      items JSONB,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sync_status (
      id SERIAL PRIMARY KEY,
      last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default token row if not exists
  const { rows: tokenRows } = await sql`SELECT COUNT(*) as count FROM tokens`;
  if (tokenRows[0].count === '0') {
    await sql`INSERT INTO tokens (id) VALUES (1)`;
  }

  // Insert default sync status if not exists
  const { rows: syncRows } = await sql`SELECT COUNT(*) as count FROM sync_status`;
  if (syncRows[0].count === '0') {
    await sql`INSERT INTO sync_status (id) VALUES (1)`;
  }
}

// Token operations
export async function getTokens() {
  const { rows } = await sql`SELECT * FROM tokens WHERE id = 1`;
  return rows[0] || null;
}

export async function saveTokens(accessToken, refreshToken, expiresAt) {
  await sql`
    UPDATE tokens
    SET access_token = ${accessToken},
        refresh_token = ${refreshToken},
        expires_at = ${expiresAt},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Sync status operations
export async function getLastSyncDate() {
  const { rows } = await sql`SELECT last_sync_at FROM sync_status WHERE id = 1`;
  return rows[0]?.last_sync_at || null;
}

export async function updateLastSyncDate() {
  await sql`UPDATE sync_status SET last_sync_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

// Order operations - UPSERT to preserve old orders and update existing ones
export async function saveOrders(orders) {
  for (const order of orders) {
    await sql`
      INSERT INTO orders (
        id, external_id, channel_label, channel_platform,
        ordered_at, updated_at, shipping_date,
        payment_status, delivery_status,
        total_gross, currency, paid_amount, items, synced_at
      ) VALUES (
        ${order.id},
        ${order.externalId},
        ${order.channel.label},
        ${order.channel.platform},
        ${order.dates.orderedAt ? new Date(order.dates.orderedAt) : null},
        ${order.dates.updatedAt ? new Date(order.dates.updatedAt) : null},
        ${order.dates.shippingDate ? new Date(order.dates.shippingDate) : null},
        ${order.status.paymentStatus},
        ${order.status.deliveryStatus},
        ${order.financials.totalGross},
        ${order.financials.currency},
        ${order.financials.paidAmount},
        ${JSON.stringify(order.items)},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        external_id = EXCLUDED.external_id,
        channel_label = EXCLUDED.channel_label,
        channel_platform = EXCLUDED.channel_platform,
        ordered_at = EXCLUDED.ordered_at,
        updated_at = EXCLUDED.updated_at,
        shipping_date = EXCLUDED.shipping_date,
        payment_status = EXCLUDED.payment_status,
        delivery_status = EXCLUDED.delivery_status,
        total_gross = EXCLUDED.total_gross,
        currency = EXCLUDED.currency,
        paid_amount = EXCLUDED.paid_amount,
        items = EXCLUDED.items,
        synced_at = CURRENT_TIMESTAMP
    `;
  }

  // Update last sync date
  await updateLastSyncDate();
}

// Helper function to map row to order object
function mapRowToOrder(row) {
  return {
    id: row.id,
    externalId: row.external_id,
    channel: {
      label: row.channel_label,
      platform: row.channel_platform
    },
    dates: {
      orderedAt: row.ordered_at,
      updatedAt: row.updated_at,
      shippingDate: row.shipping_date
    },
    status: {
      paymentStatus: row.payment_status,
      deliveryStatus: row.delivery_status
    },
    financials: {
      totalGross: parseFloat(row.total_gross),
      currency: row.currency,
      paidAmount: parseFloat(row.paid_amount)
    },
    items: row.items || []
  };
}

// Get orders with pagination and optional search
export async function getOrders(page = 1, perPage = 20, search = '') {
  const offset = (page - 1) * perPage;

  let rows, countRows;

  if (search && search.trim() !== '') {
    const searchPattern = `%${search.trim()}%`;

    // Search in id, external_id, channel_label, and item names (JSONB)
    const result = await sql`
      SELECT * FROM orders
      WHERE
        id ILIKE ${searchPattern}
        OR external_id ILIKE ${searchPattern}
        OR channel_label ILIKE ${searchPattern}
        OR channel_platform ILIKE ${searchPattern}
        OR items::text ILIKE ${searchPattern}
      ORDER BY updated_at DESC
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM orders
      WHERE
        id ILIKE ${searchPattern}
        OR external_id ILIKE ${searchPattern}
        OR channel_label ILIKE ${searchPattern}
        OR channel_platform ILIKE ${searchPattern}
        OR items::text ILIKE ${searchPattern}
    `;
    countRows = countResult.rows;
  } else {
    const result = await sql`
      SELECT * FROM orders
      ORDER BY updated_at DESC
      LIMIT ${perPage}
      OFFSET ${offset}
    `;
    rows = result.rows;

    const countResult = await sql`SELECT COUNT(*) as total FROM orders`;
    countRows = countResult.rows;
  }

  const totalCount = parseInt(countRows[0].total);
  const totalPages = Math.ceil(totalCount / perPage);

  return {
    orders: rows.map(mapRowToOrder),
    pagination: {
      page,
      perPage,
      totalCount,
      totalPages
    }
  };
}

// Get single order by ID
export async function getOrderById(id) {
  const { rows } = await sql`SELECT * FROM orders WHERE id = ${id}`;

  if (rows.length === 0) return null;

  return mapRowToOrder(rows[0]);
}
