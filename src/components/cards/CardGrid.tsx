import { useRef, useCallback } from 'react';
import { Plus, Heart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { clsx } from 'clsx';
import type { PokemonCard } from '@/types/pokemon';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { CardItem } from './CardItem';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { getRarityBadgeColor } from '@/utils/cardHelpers';

interface CardGridProps {
  cards: PokemonCard[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCardClick?: (card: PokemonCard) => void;
  onAddToDeck?: (card: PokemonCard) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
  compact?: boolean;
  viewMode?: 'grid' | 'grid-sm' | 'list';
}

function ListRow({ card, onClick, onAddToDeck }: {
  card: PokemonCard;
  onClick?: (card: PokemonCard) => void;
  onAddToDeck?: (card: PokemonCard) => void;
}) {
  const { setCardDetailId, addToast } = useUIStore();
  const { addCard, toggleWishlist } = useCollectionStore();

  const collectionEntry = useLiveQuery(
    () => db.collection.where('cardId').equals(card.id).first(),
    [card.id],
  );

  const ownedCount = (collectionEntry?.quantity ?? 0) + (collectionEntry?.quantityFoil ?? 0);

  return (
    <div
      className="flex items-center gap-3 bg-card-bg border border-card-border rounded-lg p-2 cursor-pointer hover:bg-card-hover transition-colors"
      onClick={() => {
        if (onClick) onClick(card);
        else setCardDetailId(card.id);
      }}
    >
      <div className="w-12 shrink-0">
        <img
          src={card.images.small}
          alt={card.name}
          className="w-full rounded"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium truncate">{card.name}</p>
          {ownedCount > 0 && (
            <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
              {ownedCount}x
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-gray-400 text-xs truncate">{card.set.name}</span>
          {card.rarity && (
            <span className={clsx('text-[10px] px-1 py-0.5 rounded text-white shrink-0', getRarityBadgeColor(card.rarity))}>
              {card.rarity.replace('Rare ', '').replace('Holo ', 'H')}
            </span>
          )}
          {card.types?.map((type) => (
            <Badge key={type} variant="type" type={type} className="text-[10px]">
              {type}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            void addCard(card.id).then(() => addToast(`Added ${card.name} to collection`, 'success'));
          }}
          className="bg-accent hover:bg-accent-hover text-white p-1.5 rounded-lg transition-colors"
          title="Add to collection"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void toggleWishlist(card.id).then(() =>
              addToast(collectionEntry?.inWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'info'),
            );
          }}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            collectionEntry?.inWishlist
              ? 'bg-pink-600 hover:bg-pink-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200',
          )}
          title="Toggle wishlist"
        >
          <Heart size={14} />
        </button>
        {onAddToDeck && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToDeck(card); }}
            className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-colors"
            title="Add to deck"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function CardGrid({
  cards,
  loading = false,
  hasMore = false,
  onLoadMore,
  onCardClick,
  onAddToDeck,
  columns = 4,
  compact = false,
  viewMode = 'grid',
}: CardGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      if (node && hasMore && onLoadMore) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              onLoadMore();
            }
          },
          { threshold: 0.1 },
        );
        observerRef.current.observe(node);
      }
    },
    [loading, hasMore, onLoadMore],
  );

  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
  };

  const isSmall = viewMode === 'grid-sm';
  const isList = viewMode === 'list';

  const gridClass = isList
    ? 'flex flex-col gap-2'
    : clsx(
        'grid',
        isSmall ? 'gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'gap-3',
        !isSmall && colClasses[columns],
      );

  return (
    <div>
      <div className={gridClass}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            ref={index === cards.length - 1 ? lastCardRef : undefined}
          >
            {isList ? (
              <ListRow card={card} onClick={onCardClick} onAddToDeck={onAddToDeck} />
            ) : (
              <CardItem
                card={card}
                onClick={onCardClick}
                onAddToDeck={onAddToDeck}
                compact={isSmall || compact}
              />
            )}
          </div>
        ))}

        {loading &&
          Array.from({ length: 8 }).map((_, i) =>
            isList ? (
              <div key={`skeleton-${i}`} className="h-16 skeleton rounded-lg" />
            ) : (
              <CardSkeleton key={`skeleton-${i}`} />
            ),
          )}
      </div>

      {!loading && cards.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">No cards found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
