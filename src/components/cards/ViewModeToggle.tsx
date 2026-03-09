import { LayoutGrid, Grid3X3, List } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '@/stores/uiStore';

const modes = [
  { key: 'grid' as const, icon: LayoutGrid },
  { key: 'grid-sm' as const, icon: Grid3X3 },
  { key: 'list' as const, icon: List },
];

export function ViewModeToggle() {
  const { cardViewMode, setCardViewMode } = useUIStore();

  return (
    <div className="flex gap-1">
      {modes.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setCardViewMode(key)}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            cardViewMode === key
              ? 'bg-accent text-white'
              : 'bg-card-border/30 text-gray-400 hover:text-white',
          )}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
