'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data);
        }
      } catch (err) {
        setError('Nie udalo sie pobrac zamowienia');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price, currency = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(price || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      // Podstawowe statusy
      4: { label: 'Niepotwierdzone', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Nowy', color: 'bg-blue-100 text-blue-800' },
      7: { label: 'W realizacji', color: 'bg-yellow-100 text-yellow-800' },
      10: { label: 'Do wyslania', color: 'bg-purple-100 text-purple-800' },
      13: { label: 'Wyslane', color: 'bg-green-100 text-green-800' },
      // PALETY
      22: { label: 'PALETY-NOWE', color: 'bg-blue-100 text-blue-800' },
      113: { label: 'PALETY-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      166: { label: 'PILNE - PALETY', color: 'bg-orange-100 text-orange-800' },
      169: { label: 'BARDZO PILNE - PALETY', color: 'bg-red-100 text-red-800' },
      // PIKOWKI
      25: { label: 'PIKOWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
      116: { label: 'PIKOWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      103: { label: 'PILNE - PIKOWKI', color: 'bg-orange-100 text-orange-800' },
      106: { label: 'BARDZO PILNE - PIKOWKI', color: 'bg-red-100 text-red-800' },
      // LAWKI
      28: { label: 'LAWKI-NOWE', color: 'bg-blue-100 text-blue-800' },
      119: { label: 'LAWKI-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      172: { label: 'PILNE - LAWKI', color: 'bg-orange-100 text-orange-800' },
      175: { label: 'BARDZO PILNE - LAWKI', color: 'bg-red-100 text-red-800' },
      // LAWKI SIEDZISKA
      199: { label: 'LAWKI SIEDZISKA-NOWE', color: 'bg-blue-100 text-blue-800' },
      205: { label: 'LAWKI SIEDZISKA-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      178: { label: 'PILNE - LAWKI SIEDZISKA', color: 'bg-orange-100 text-orange-800' },
      181: { label: 'BARDZO PILNE - LAWKI SIEDZISKA', color: 'bg-red-100 text-red-800' },
      // POOM KIDS
      31: { label: 'POOM KIDS-NOWE', color: 'bg-blue-100 text-blue-800' },
      122: { label: 'POOM KIDS-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      228: { label: 'PILNE - POOM KIDS', color: 'bg-orange-100 text-orange-800' },
      225: { label: 'BARDZO PILNE - POOM KIDS', color: 'bg-red-100 text-red-800' },
      // LEGOWISKA
      46: { label: 'LEGOWISKA-NOWE', color: 'bg-blue-100 text-blue-800' },
      131: { label: 'LEGOWISKA-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      184: { label: 'PILNE - LEGOWISKA', color: 'bg-orange-100 text-orange-800' },
      187: { label: 'BARDZO PILNE - LEGOWISKA', color: 'bg-red-100 text-red-800' },
      // SARIS GARAGE
      57: { label: 'SARIS GARAGE-NOWE', color: 'bg-blue-100 text-blue-800' },
      125: { label: 'SARIS GARAGE-W REALIZACJI', color: 'bg-yellow-100 text-yellow-800' },
      220: { label: 'SARIS GARAGE BARDZO PILNE', color: 'bg-red-100 text-red-800' },
      209: { label: 'SARIS GARAGE', color: 'bg-gray-100 text-gray-800' }
    };
    const s = statusMap[status] || { label: `Status ${status}`, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>{s.label}</span>;
  };

  const renderPlatformIcon = (platform) => {
    const platformIcons = {
      'Amazon': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoIwGv61BBxMlFDmBHeDvMo8-5HNlM4_8Skw&s',
      'Allegro': 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5',
      'Shopify': 'https://images.icon-icons.com/836/PNG/512/Shopify_icon-icons.com_66757.png',
      'Kaufland': 'https://logotypy.net/wp-content/uploads/2023/09/logo-kaufland.jpg'
    };

    if (platformIcons[platform]) {
      return (
        <img
          src={platformIcons[platform]}
          alt={platform}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {platform?.charAt(0) || '?'}
      </div>
    );
  };

  const AddressCard = ({ title, address, fallbackText }) => {
    if (!address && !fallbackText) return null;

    if (!address || (!address.name && !address.street)) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-500">{fallbackText || 'Brak danych'}</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-2 text-gray-700">
          <p className="font-medium">{address.name}</p>
          {address.companyName && <p className="text-sm">{address.companyName}</p>}
          {address.companyTaxNumber && <p className="text-sm">NIP: {address.companyTaxNumber}</p>}
          <p>{address.street} {address.streetNumber}</p>
          <p>{address.zipCode} {address.city}</p>
          <p>{address.country}</p>
          {address.phone && <p className="mt-2">{address.phone}</p>}
          {address.email && <p className="text-sm text-blue-600">{address.email}</p>}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/zamowienia" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Powrot do zamowien
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link href="/zamowienia" className="text-blue-600 hover:underline mb-6 inline-block">
          &larr; Powrot do zamowien
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {renderPlatformIcon(order.channel?.platform)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Zamowienie {order.id}
                </h1>
                <p className="text-gray-600">{order.channel?.label}</p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(order.status?.deliveryStatus)}
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status?.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.status?.paymentStatus === 'PAID' ? 'Oplacone' : 'Nieoplacone'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Szczegoly zamowienia</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Numer zamowienia:</span>
                <span className="font-medium">{order.id}</span>
              </div>
              {order.externalId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Numer zewnetrzny:</span>
                  <span className="font-medium">{order.externalId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Data zamowienia:</span>
                <span className="font-medium">{formatDate(order.dates?.orderedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kanal sprzedazy:</span>
                <span className="font-medium">{order.channel?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platforma:</span>
                <span className="font-medium">{order.channel?.platform}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Payments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platnosci i wysylka</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Wartosc netto:</span>
                <span className="font-medium">{formatPrice(order.financials?.totalNet, order.financials?.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wartosc brutto:</span>
                <span className="font-bold text-lg">{formatPrice(order.financials?.totalGross, order.financials?.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zaplacono:</span>
                <span className="font-medium text-green-600">{formatPrice(order.financials?.paidAmount, order.financials?.currency)}</span>
              </div>

              {order.payments && order.payments.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Historia platnosci:</p>
                  {order.payments.map((payment, idx) => (
                    <div key={idx} className="text-sm flex justify-between py-1">
                      <span>{formatDate(payment.date)} - {payment.type}</span>
                      <span className="font-medium">{formatPrice(payment.amount, payment.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <AddressCard title="Dane zamawiajacego" address={order.customer} fallbackText="Dane zaszyfrowane przez platforme" />
          <AddressCard title="Dane wysylki" address={order.shipping} fallbackText="Wysylka: 0.00 (dane zaszyfrowane)" />
          <AddressCard title="Dane do faktury" address={order.invoice || order.shipping} fallbackText="Brak danych do faktury" />
        </div>

        {/* Notes */}
        {order.notes && order.notes.length > 0 && (
          <div className="bg-yellow-50 rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uwagi do zamowienia</h3>
            {order.notes.map((note, idx) => (
              <div key={idx} className="text-gray-700">
                <p>{note.comment}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDate(note.createdAt)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Produkty</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item, index) => (
              <div
                key={index}
                className={`px-6 py-4 flex items-center gap-4 ${item.isShipping ? 'bg-gray-50' : ''}`}
              >
                {/* Image */}
                <div className="w-16 h-16 flex-shrink-0">
                  {item.isShipping ? (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                  ) : item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="object-cover rounded"
                      unoptimized
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-grow">
                  <div className="font-medium text-gray-900">
                    {item.isShipping && <span className="text-gray-500 mr-2">[Wysylka]</span>}
                    {item.name}
                  </div>
                  {item.sku && <div className="text-sm text-gray-500">SKU: {item.sku}</div>}
                  {item.ean && <div className="text-sm text-gray-500">EAN: {item.ean}</div>}
                </div>

                {/* Quantity */}
                <div className="text-center px-4">
                  <div className="text-sm text-gray-500">Ilosc</div>
                  <div className="font-medium">{item.quantity}</div>
                </div>

                {/* Price */}
                <div className="text-center px-4">
                  <div className="text-sm text-gray-500">Cena</div>
                  <div className="font-medium">{formatPrice(item.priceGross, order.financials?.currency)}</div>
                </div>

                {/* Total */}
                <div className="text-right px-4 min-w-[100px]">
                  <div className="text-sm text-gray-500">Suma</div>
                  <div className="font-bold">{formatPrice(item.totalGross, order.financials?.currency)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <div className="text-right">
              <div className="text-sm text-gray-500">Razem</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(order.financials?.totalGross, order.financials?.currency)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
