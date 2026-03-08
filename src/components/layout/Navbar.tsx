import { NavLink } from 'react-router-dom';
import { Home, Search, BookOpen, Layers, Camera, Settings, Zap } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', exact: true },
  { to: '/cards', icon: Search, label: 'Card Browser' },
  { to: '/collection', icon: BookOpen, label: 'My Collection' },
  { to: '/decks', icon: Layers, label: 'My Decks' },
  { to: '/scanner', icon: Camera, label: 'Card Scanner' },
];

export function Navbar() {
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

      {/* Settings */}
      <div className="p-3 border-t border-card-border">
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
          Settings
        </NavLink>
        <p className="text-gray-600 text-xs text-center mt-3">PokeVault v1.0</p>
      </div>
    </aside>
  );
}
