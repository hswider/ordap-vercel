import { NextResponse } from 'next/server';
import { initDatabase, getOrderById } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    await initDatabase();

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Zamowienie nie znalezione' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[API] Error fetching order:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
