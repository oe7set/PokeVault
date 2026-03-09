import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { ToastContainer } from '@/components/ui/Toast';
import { useTranslation } from '@/i18n/LanguageContext';
import { LOCALES } from '@/i18n/translations';

export function Layout() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex min-h-screen bg-[#0d0d1a]">
      <Navbar />
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {/* Mobile language bar */}
        <div className="flex items-center justify-center gap-1 py-1.5 bg-surface-50/80 border-b border-card-border md:hidden">
          {LOCALES.map((loc) => (
            <button
              key={loc.code}
              onClick={() => setLocale(loc.code)}
              className={clsx(
                'text-sm px-1.5 py-0.5 rounded transition-colors',
                locale === loc.code
                  ? 'bg-accent/20 ring-1 ring-accent'
                  : 'hover:bg-card-hover',
              )}
              title={loc.label}
            >
              {loc.flag}
            </button>
          ))}
        </div>
        <Outlet />
      </main>
      <BottomNav />
      <CardDetailModal />
      <ToastContainer />
    </div>
  );
}
