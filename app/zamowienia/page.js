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
  const [perPage, setPerPage] = useState(20);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');

  // Fetch available channels
  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch('/api/channels');
        const data = await res.json();
        if (data.channels) {
          setChannels(data.channels);
        }
      } catch (err) {
        console.error('Failed to load channels:', err);
      }
    }
    loadChannels();
  }, []);

  const fetchOrders = useCallback(async (page = 1, search = '', itemsPerPage = 20, channel = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: itemsPerPage.toString()
      });

      if (search) {
        params.append('search', search);
      }

      if (channel) {
        params.append('channel', channel);
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
    fetchOrders(1, query, perPage, selectedChannel);
  };

  const handlePageChange = (newPage) => {
    fetchOrders(newPage, searchQuery, perPage, selectedChannel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    fetchOrders(1, searchQuery, newPerPage, selectedChannel);
  };

  const handleChannelChange = (channel) => {
    setSelectedChannel(channel);
    fetchOrders(1, searchQuery, perPage, channel);
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        await fetchOrders(1, searchQuery, perPage, selectedChannel);
      }
    } catch (err) {
      setError('Synchronizacja nie powiodla sie');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, '', 20, '');
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Zamowienia</h1>
            {pagination && (
              <p className="text-xs sm:text-sm text-gray-500">
                {selectedChannel ? `${selectedChannel}: ` : ''}
                {pagination.totalCount} zam.
              </p>
            )}
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {syncing ? 'Sync...' : 'Sync'}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3">
          {/* Search and Channel Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <SearchBox onSearch={handleSearch} initialValue={searchQuery} />
            </div>
            <select
              value={selectedChannel}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Wszystkie kanaly</option>
              {channels.map((ch, idx) => (
                <option key={idx} value={ch.label}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>
          {/* Per Page Selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Pokazuj:</span>
            <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-600">na stronie</span>
            {selectedChannel && (
              <button
                onClick={() => handleChannelChange('')}
                className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
              >
                Wyczysc filtr
              </button>
            )}
          </div>
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
