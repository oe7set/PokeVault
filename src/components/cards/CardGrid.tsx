import { useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import type { PokemonCard } from '@/types/pokemon';
import { CardItem } from './CardItem';
import { CardSkeleton } from '@/components/ui/Skeleton';

interface CardGridProps {
  cards: PokemonCard[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCardClick?: (card: PokemonCard) => void;
  onAddToDeck?: (card: PokemonCard) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
  compact?: boolean;
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

  return (
    <div>
      <div className={clsx('grid gap-3', colClasses[columns])}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            ref={index === cards.length - 1 ? lastCardRef : undefined}
          >
            <CardItem
              card={card}
              onClick={onCardClick}
              onAddToDeck={onAddToDeck}
              compact={compact}
            />
          </div>
        ))}

        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={`skeleton-${i}`} />
          ))}
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
