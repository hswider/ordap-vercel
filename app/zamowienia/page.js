'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderList from '@/components/OrderList';
import Pagination from '@/components/Pagination';

export default function ZamowieniaPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?page=${page}&perPage=20`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setOrders(data.orders || []);
        setPagination(data.pagination);
        setError(null);
      }
    } catch (err) {
      setError('Nie udalo sie pobrac zamowien');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        await fetchOrders(1);
      }
    } catch (err) {
      setError('Synchronizacja nie powiodla sie');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zamowienia</h1>
            {pagination && (
              <p className="text-gray-500">
                Laczna liczba zamowien: {pagination.totalCount}
              </p>
            )}
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Synchronizacja...' : 'Synchronizuj'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
            Brak zamowien. Kliknij "Synchronizuj" aby pobrac dane z Apilo.
          </div>
        ) : (
          <>
            <OrderList orders={orders} />
            {pagination && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
