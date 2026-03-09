import { NavLink } from 'react-router-dom';
import { Home, Search, BookOpen, Layers, Camera, Settings, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from '@/i18n/LanguageContext';
import { LOCALES } from '@/i18n/translations';

export function Navbar() {
  const { t, locale, setLocale } = useTranslation();

  const navItems = [
    { to: '/', icon: Home, label: t('nav.dashboard'), exact: true },
    { to: '/cards', icon: Search, label: t('nav.cardBrowser') },
    { to: '/collection', icon: BookOpen, label: t('nav.myCollection') },
    { to: '/decks', icon: Layers, label: t('nav.myDecks') },
    { to: '/scanner', icon: Camera, label: t('nav.cardScanner') },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 bg-surface-50 border-r border-card-border h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-card-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold font-display text-lg leading-none">PokeVault</p>
            <p className="text-gray-500 text-xs">TCG Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-card-hover',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Language & Settings */}
      <div className="p-3 border-t border-card-border">
        <div className="flex flex-wrap justify-center gap-1 mb-2">
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
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full',
              isActive
                ? 'bg-accent text-white'
                : 'text-gray-400 hover:text-white hover:bg-card-hover',
            )
          }
        >
          <Settings size={18} />
          {t('nav.settings')}
        </NavLink>
        <p className="text-gray-600 text-xs text-center mt-3">PokeVault v1.0</p>
      </div>
    </aside>
  );
}
