import { Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import type { PokemonCard } from '@/types/pokemon';
import type { CollectionOverlay } from '@/types/deck';
import { Badge } from '@/components/ui/Badge';

interface DeckCardRowProps {
  cardId: string;
  count: number;
  card?: PokemonCard;
  overlay?: CollectionOverlay;
  onAdd: () => void;
  onRemove: () => void;
  onSetCount: (count: number) => void;
  onCardClick?: () => void;
}

const borderColors: Record<string, string> = {
  owned: 'border-l-green-500',
  partial: 'border-l-yellow-500',
  missing: 'border-l-red-500',
};

export function DeckCardRow({ cardId, count, card, overlay, onAdd, onRemove, onSetCount, onCardClick }: DeckCardRowProps) {
  const price = card?.cardmarket?.prices?.averageSellPrice;

  return (
    <div
      className={clsx(
        'flex items-center gap-2 bg-card-bg/60 rounded-lg px-2 py-1.5 group border-l-2',
        overlay ? borderColors[overlay.status] : 'border-l-transparent',
      )}
    >
      <div
        className={clsx('flex items-center gap-2 flex-1 min-w-0', onCardClick && 'cursor-pointer')}
        onClick={onCardClick}
      >
        {card?.images.small && (
          <img src={card.images.small} alt={card.name} className="w-7 h-10 object-cover rounded shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-white truncate">{card?.name ?? cardId}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {card?.types?.map((t) => (
            <Badge key={t} variant="type" type={t} className="text-[9px]">{t}</Badge>
          ))}
          {price != null && price > 0 && (
            <span className="text-[9px] text-gray-500 ml-1">${price.toFixed(2)}</span>
          )}
        </div>
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => onSetCount(n)}
            className={clsx(
              'w-4 h-4 rounded text-[9px] font-bold transition-colors',
              count === n ? 'bg-accent text-white' : 'bg-card-border text-gray-400 hover:text-white',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 group-hover:hidden">
        <span className="text-white text-xs font-bold w-4 text-center">{count}</span>
      </div>
      <div className="hidden group-hover:flex items-center gap-1">
        <button onClick={onRemove} className="text-gray-400 hover:text-red-400 transition-colors">
          <Minus size={12} />
        </button>
        <span className="text-white text-xs font-bold w-4 text-center">{count}</span>
        <button onClick={onAdd} className="text-gray-400 hover:text-green-400 transition-colors">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
