import { NavLink } from 'react-router-dom';
import { Home, Search, BookOpen, Layers, Camera } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from '@/i18n/LanguageContext';

export function BottomNav() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home'), exact: true },
    { to: '/cards', icon: Search, label: t('nav.cards') },
    { to: '/collection', icon: BookOpen, label: t('nav.collection') },
    { to: '/decks', icon: Layers, label: t('nav.decks') },
    { to: '/scanner', icon: Camera, label: t('nav.scan') },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-50/95 backdrop-blur border-t border-card-border z-40 md:hidden">
      <div className="flex items-stretch h-16">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors text-xs',
                isActive
                  ? 'text-accent'
                  : 'text-gray-500 hover:text-gray-300',
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
