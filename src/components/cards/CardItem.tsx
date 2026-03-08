import { useState } from 'react';
import { Plus, Heart, Star } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { clsx } from 'clsx';
import type { PokemonCard } from '@/types/pokemon';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { getCardGlowClass } from '@/utils/typeColors';
import { getRarityBadgeColor } from '@/utils/cardHelpers';
import { Badge } from '@/components/ui/Badge';

interface CardItemProps {
  card: PokemonCard;
  onClick?: (card: PokemonCard) => void;
  onAddToDeck?: (card: PokemonCard) => void;
  compact?: boolean;
  showControls?: boolean;
}

export function CardItem({ card, onClick, onAddToDeck, compact = false, showControls = true }: CardItemProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { setCardDetailId, addToast } = useUIStore();
  const { addCard, toggleWishlist } = useCollectionStore();

  const collectionEntry = useLiveQuery(
    () => db.collection.where('cardId').equals(card.id).first(),
    [card.id],
  );

  const ownedCount = (collectionEntry?.quantity ?? 0) + (collectionEntry?.quantityFoil ?? 0);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addCard(card.id);
    addToast(`Added ${card.name} to collection`, 'success');
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleWishlist(card.id);
    addToast(
      collectionEntry?.inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      'info',
    );
  };

  const glowClass = getCardGlowClass(card.types);

  return (
    <div
      className={clsx(
        'group relative bg-card-bg border border-card-border rounded-xl overflow-hidden',
        'cursor-pointer transition-all duration-200 card-shine',
        glowClass,
        compact ? 'p-0' : '',
      )}
      onClick={() => {
        if (onClick) onClick(card);
        else setCardDetailId(card.id);
      }}
    >
      {/* Card Image */}
      <div className={clsx('relative overflow-hidden bg-gray-800', compact ? 'aspect-[2.5/3.5]' : 'aspect-[2.5/3.5]')}>
        {!imgLoaded && (
          <div className="skeleton absolute inset-0" />
        )}
        <img
          src={card.images.small}
          alt={card.name}
          className={clsx(
            'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
            imgLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => setImgLoaded(true)}
          loading="lazy"
        />

        {/* Owned count badge */}
        {ownedCount > 0 && (
          <div className="absolute top-1 left-1 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full z-10">
            {ownedCount}×
          </div>
        )}

        {/* Wishlist indicator */}
        {collectionEntry?.inWishlist && (
          <div className="absolute top-1 right-1 text-pink-400 z-10">
            <Heart size={14} fill="currentColor" />
          </div>
        )}

        {/* Hover controls */}
        {showControls && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
            <button
              onClick={handleAdd}
              className="bg-accent hover:bg-accent-hover text-white p-2 rounded-lg transition-colors"
              title="Add to collection"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={handleWishlist}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                collectionEntry?.inWishlist
                  ? 'bg-pink-600 hover:bg-pink-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200',
              )}
              title="Toggle wishlist"
            >
              <Heart size={16} />
            </button>
            {onAddToDeck && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToDeck(card); }}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
                title="Add to deck"
              >
                <Star size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Info */}
      {!compact && (
        <div className="p-2">
          <p className="text-white text-xs font-medium truncate">{card.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-400 text-[10px] truncate">{card.set.name}</p>
            {card.rarity && (
              <span className={clsx('text-[10px] px-1 py-0.5 rounded text-white', getRarityBadgeColor(card.rarity))}>
                {card.rarity.replace('Rare ', '').replace('Holo ', 'H')}
              </span>
            )}
          </div>
          {card.types && card.types.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {card.types.map((type) => (
                <Badge key={type} variant="type" type={type} className="text-[10px]">
                  {type}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
