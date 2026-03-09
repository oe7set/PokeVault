import { ClipboardCopy, Heart } from 'lucide-react';
import type { MissingCardSummary } from '@/types/deck';
import { useCollectionStore } from '@/stores/collectionStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';

interface MissingCardsPanelProps {
  missingCards: MissingCardSummary[];
  totalMissingValue: number;
}

export function MissingCardsPanel({ missingCards, totalMissingValue }: MissingCardsPanelProps) {
  const { toggleWishlist } = useCollectionStore();
  const { addToast } = useUIStore();

  if (missingCards.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-center">
        <p className="text-sm text-green-400 font-medium">You own all cards in this deck!</p>
      </div>
    );
  }

  const handleAddAllToWishlist = async () => {
    for (const card of missingCards) {
      await toggleWishlist(card.cardId);
    }
    addToast(`Added ${missingCards.length} cards to wishlist`, 'success');
  };

  const handleCopyShoppingList = () => {
    const lines = missingCards.map((c) => {
      const priceStr = c.estimatedPrice > 0 ? ` (~$${c.estimatedPrice.toFixed(2)})` : '';
      return `${c.deficit}x ${c.name}${priceStr}`;
    });
    if (totalMissingValue > 0) {
      lines.push(`\nTotal: ~$${totalMissingValue.toFixed(2)}`);
    }
    void navigator.clipboard.writeText(lines.join('\n'));
    addToast('Shopping list copied to clipboard', 'success');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-semibold">
          Missing Cards ({missingCards.reduce((s, c) => s + c.deficit, 0)})
        </p>
        {totalMissingValue > 0 && (
          <span className="text-xs text-yellow-400 font-medium">
            ~${totalMissingValue.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {missingCards.map((card) => (
          <div key={card.cardId} className="flex items-center justify-between bg-red-900/10 border border-red-700/20 rounded-lg px-3 py-1.5">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{card.name}</p>
              <p className="text-[10px] text-gray-500">
                Own {card.owned}/{card.needed} (need {card.deficit})
              </p>
            </div>
            {card.estimatedPrice > 0 && (
              <span className="text-[10px] text-gray-400 ml-2">${card.estimatedPrice.toFixed(2)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleAddAllToWishlist} className="flex-1">
          <Heart size={12} />
          Add to Wishlist
        </Button>
        <Button variant="secondary" size="sm" onClick={handleCopyShoppingList} className="flex-1">
          <ClipboardCopy size={12} />
          Copy List
        </Button>
      </div>
    </div>
  );
}
