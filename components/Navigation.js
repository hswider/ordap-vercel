'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/zamowienia', label: 'Zamowienia', icon: '📦' },
  ];

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        {/* Top bar with logo */}
        <div className="flex items-center justify-between h-12 sm:h-14">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://cdn.shopify.com/s/files/1/0974/8525/9083/files/dxzadaa.png?v=1763118294"
              alt="POOM Logo"
              className="h-8 sm:h-10 w-auto"
            />
            <span className="text-lg sm:text-xl font-bold text-gray-800">POOM</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href || (item.href === '/zamowienia' && pathname.startsWith('/zamowienia'))
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile navigation tabs */}
        <div className="sm:hidden flex border-t border-gray-100 -mx-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/zamowienia' && pathname.startsWith('/zamowienia'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
