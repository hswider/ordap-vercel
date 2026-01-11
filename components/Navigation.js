'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/zamowienia', label: 'Zamowienia', icon: '📦' },
    { href: '/wms', label: 'WMS', icon: '🏭' },
    { href: '/crm', label: 'CRM', icon: '👥' },
    { href: '/agent', label: 'Agent AI', icon: '🤖' },
  ];

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-1 sm:px-6">
        <div className="flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href === '/zamowienia' && pathname.startsWith('/zamowienia')) ||
              (item.href === '/agent' && pathname.startsWith('/agent'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg sm:text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
