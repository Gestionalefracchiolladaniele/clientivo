'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from '@/hooks/useAccount';

const tabs = [
  { id: 'onedigit', label: 'OneDigit', href: '/app/onedigit' },
  { id: 'pulsemargin', label: 'PulseMargin', href: '/app/pulsemargin' },
  { id: 'quotebuilder', label: 'QuoteBuilder', href: '/app/quotebuilder' },
] as const;

const subNavs: Record<string, { label: string; href: string }[]> = {
  onedigit: [
    { label: 'Clienti', href: '/app/onedigit/clienti' },
    { label: 'Pacchetti', href: '/app/onedigit/pacchetti' },
    { label: 'Contratti', href: '/app/onedigit/contratti' },
  ],
  pulsemargin: [
    { label: 'Dashboard', href: '/app/pulsemargin' },
  ],
  quotebuilder: [
    { label: 'Preventivi', href: '/app/quotebuilder' },
    { label: 'Template', href: '/app/quotebuilder/templates' },
  ],
};

export function Navigation() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { data: account } = useAccount();

  const activeTab = tabs.find(t => pathname.startsWith(t.href));
  const subNav = activeTab ? subNavs[activeTab.id] : [];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-gray-900 tracking-tight">Piattaforma</span>
            <nav className="flex gap-1" aria-label="Moduli">
              {tabs.map(tab => {
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {account?.avatar_url ? (
              <img
                src={account.avatar_url}
                alt={account.full_name ?? ''}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium">
                {account?.full_name?.[0] ?? account?.email?.[0] ?? '?'}
              </div>
            )}
            <span className="text-sm text-gray-700 hidden sm:block">
              {account?.full_name ?? account?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Esci
            </button>
          </div>
        </div>

        {/* Sub-nav */}
        {subNav.length > 1 && (
          <nav className="flex gap-4 pb-0" aria-label="Sezioni">
            {subNav.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm pb-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
