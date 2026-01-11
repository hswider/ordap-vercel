'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderList from '@/components/OrderList';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';

export default function ZamowieniaPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '20'
      });

      if (search) {
        params.append('search', search);
      }

      const res = await fetch(`/api/orders?${params}`);
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

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchOrders(1, query);
  };

  const handlePageChange = (newPage) => {
    fetchOrders(newPage, searchQuery);
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
        await fetchOrders(1, searchQuery);
      }
    } catch (err) {
      setError('Synchronizacja nie powiodla sie');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, '');
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zamowienia</h1>
            {pagination && (
              <p className="text-gray-500">
                {searchQuery
                  ? `Znaleziono ${pagination.totalCount} zamowien`
                  : `Laczna liczba zamowien: ${pagination.totalCount}`}
              </p>
            )}
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {syncing ? 'Synchronizacja...' : 'Synchronizuj'}
          </button>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <SearchBox onSearch={handleSearch} initialValue={searchQuery} />
        </div>

        {/* Content */}
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
            {searchQuery
              ? `Nie znaleziono zamowien dla "${searchQuery}"`
              : 'Brak zamowien. Kliknij "Synchronizuj" aby pobrac dane z Apilo.'}
          </div>
        ) : (
          <>
            <OrderList orders={orders} />
            {pagination && pagination.totalPages > 1 && (
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
