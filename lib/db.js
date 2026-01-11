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

  // Insert default token row if not exists
  const { rows } = await sql`SELECT COUNT(*) as count FROM tokens`;
  if (rows[0].count === '0') {
    await sql`INSERT INTO tokens (id) VALUES (1)`;
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

// Order operations
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
}

export async function getOrders(limit = 10) {
  const { rows } = await sql`
    SELECT * FROM orders
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `;

  return rows.map(row => ({
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
  }));
}
