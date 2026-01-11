'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function OrderItem({ order }) {
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
    }).format(price);
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      'Allegro': 'A',
      'Amazon': 'Am',
      'Shopify': 'S',
      'WooCommerce': 'W',
      'PrestaShop': 'P'
    };
    return icons[platform] || platform?.charAt(0) || '?';
  };

  const getStatusInfo = (status) => {
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
    return statusMap[status] || { label: `Status ${status}`, color: 'bg-gray-100 text-gray-800' };
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
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
        {getPlatformIcon(platform)}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Order Header - Clickable */}
      <Link href={`/zamowienia/${order.id}`} className="block">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            {renderPlatformIcon(order.channel?.platform)}
            <div>
              <div className="font-semibold text-gray-900">
                {order.channel?.label || 'Nieznany kanal'}
              </div>
              <div className="text-sm text-gray-500">
                ID: {order.id} {order.externalId && `| Ext: ${order.externalId}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Status zamowienia */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(order.status?.deliveryStatus).color}`}>
              {getStatusInfo(order.status?.deliveryStatus).label}
            </span>
            {/* Status platnosci */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.status?.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {order.status?.paymentStatus === 'PAID' ? 'Oplacone' : 'Nieoplacone'}
            </span>
            <div className="text-right ml-2">
              <div className="font-bold text-lg text-gray-900">
                {formatPrice(order.financials?.totalGross, order.financials?.currency)}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(order.dates?.orderedAt)}
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Order Items */}
      <div className="divide-y divide-gray-100">
        {order.items?.map((item, index) => (
          <div
            key={index}
            className={`px-6 py-4 flex items-center gap-4 ${
              item.isShipping ? 'bg-gray-50' : ''
            }`}
          >
            {/* Image */}
            <div className="w-16 h-16 flex-shrink-0 relative">
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
                {item.isShipping && (
                  <span className="text-gray-500 mr-2">[Wysylka]</span>
                )}
                {item.name}
              </div>
              {item.sku && (
                <div className="text-sm text-gray-500">SKU: {item.sku}</div>
              )}
            </div>

            {/* Quantity */}
            <div className="text-center px-4">
              <div className="text-sm text-gray-500">Ilosc</div>
              <div className="font-medium">{item.quantity}</div>
            </div>

            {/* Price */}
            <div className="text-center px-4">
              <div className="text-sm text-gray-500">Cena</div>
              <div className="font-medium">
                {formatPrice(item.priceGross, order.financials?.currency)}
              </div>
            </div>

            {/* Total */}
            <div className="text-right px-4 min-w-[100px]">
              <div className="text-sm text-gray-500">Suma</div>
              <div className="font-bold">
                {formatPrice(item.totalGross, order.financials?.currency)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
