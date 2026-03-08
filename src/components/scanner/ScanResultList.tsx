import { Plus } from 'lucide-react';
import type { PokemonCard } from '@/types/pokemon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCollectionStore } from '@/stores/collectionStore';
import { useUIStore } from '@/stores/uiStore';

interface ScanResultListProps {
  cards: PokemonCard[];
  ocrText?: string;
  onReset: () => void;
}

export function ScanResultList({ cards, ocrText, onReset }: ScanResultListProps) {
  const { addCard } = useCollectionStore();
  const { addToast } = useUIStore();

  const handleAdd = async (card: PokemonCard) => {
    await addCard(card.id);
    addToast(`Added ${card.name} to collection!`, 'success');
    onReset();
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-gray-300 font-medium">No cards found</p>
        {ocrText && (
          <p className="text-gray-500 text-sm mt-1">OCR detected: "{ocrText}"</p>
        )}
        <p className="text-gray-500 text-sm mt-2">Try better lighting or use manual search</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onReset}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ocrText && (
        <p className="text-xs text-gray-500">Detected text: "<span className="text-gray-300">{ocrText}</span>"</p>
      )}
      <p className="text-sm text-gray-400">Select the matching card:</p>

      {cards.map((card) => (
        <div
          key={card.id}
          className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl p-3 hover:border-accent/50 transition-colors"
        >
          <img
            src={card.images.small}
            alt={card.name}
            className="w-14 rounded-lg shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{card.name}</p>
            <p className="text-gray-400 text-xs">{card.set.name} #{card.number}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {card.types?.map((t) => (
                <Badge key={t} variant="type" type={t} className="text-[10px]">{t}</Badge>
              ))}
              {card.rarity && (
                <Badge variant="outline" className="text-[10px]">{card.rarity}</Badge>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => void handleAdd(card)}
            className="shrink-0"
          >
            <Plus size={14} />
            Add
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
        Scan Another Card
      </Button>
    </div>
  );
}
