'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getPlatformIcon = (platform) => {
    const icons = {
      'Amazon': '🛒',
      'Allegro': '🅰️',
      'Shopify': '🛍️',
      'Kaufland': '🏪',
      'eBay': '📦',
    };
    return icons[platform] || '📋';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">Przeglad zamowien</p>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Sync...' : 'Sync'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Dzisiaj</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.summary?.ordersToday || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Wczoraj</p>
                <p className="text-2xl font-bold text-gray-700">{stats?.summary?.ordersYesterday || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Wyslano dzis</p>
                <p className="text-2xl font-bold text-green-600">{stats?.summary?.shippedToday || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Wyslano wczoraj</p>
                <p className="text-2xl font-bold text-gray-700">{stats?.summary?.shippedYesterday || 0}</p>
              </div>
            </div>

            {/* Orders Today by Platform */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Zamowienia dzisiaj</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats?.todayByPlatform?.length > 0 ? (
                  stats.todayByPlatform.map((item, idx) => (
                    <div key={idx} className="px-4 py-2.5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{getPlatformIcon(item.platform)}</span>
                        <span className="text-sm text-gray-700">{item.platform}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">Brak zamowien dzisiaj</div>
                )}
              </div>
              {stats?.todayByPlatform?.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Razem</span>
                  <span className="font-bold text-blue-600">{stats?.summary?.ordersToday || 0}</span>
                </div>
              )}
            </div>

            {/* Orders Last 30 Days by Platform */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Zamowienia z 30 dni</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats?.last30DaysByPlatform?.map((item, idx) => (
                  <div key={idx} className="px-4 py-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>{getPlatformIcon(item.platform)}</span>
                      <span className="text-sm text-gray-700">{item.platform}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Razem (30 dni)</span>
                <span className="font-bold text-gray-900">
                  {stats?.last30DaysByPlatform?.reduce((sum, item) => sum + item.count, 0) || 0}
                </span>
              </div>
            </div>

            {/* Quick Link */}
            <Link
              href="/zamowienia"
              className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-medium"
            >
              Zobacz wszystkie zamowienia ({stats?.summary?.totalOrders || 0})
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
