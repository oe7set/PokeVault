import { useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import type { PokemonCard } from '@/types/pokemon';
import type { ScoredCard } from '@/utils/scannerEngine';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCollectionStore } from '@/stores/collectionStore';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from '@/i18n/LanguageContext';

interface ScanResultListProps {
  cards: ScoredCard[];
  ocrText?: string;
  onReset: () => void;
  onReSearch?: (query: string) => void;
}

function ConfidenceBadge({ confidence, t }: { confidence: number; t: (k: string) => string }) {
  if (confidence >= 0.8) {
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-700/30">{t('scanner.confidence.high')}</span>;
  }
  if (confidence >= 0.5) {
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">{t('scanner.confidence.medium')}</span>;
  }
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/30">{t('scanner.confidence.low')}</span>;
}

function MatchMethodLabel({ method, t }: { method: string; t: (k: string) => string }) {
  const key = method === 'exact' ? 'scanner.matchExact' : method === 'variant' ? 'scanner.matchVariant' : 'scanner.matchFuzzy';
  return <span className="text-[10px] text-gray-500">{t(key)}</span>;
}

export function ScanResultList({ cards, ocrText, onReset, onReSearch }: ScanResultListProps) {
  const { t } = useTranslation();
  const { addCard } = useCollectionStore();
  const { addToast, setCardDetailId } = useUIStore();
  const [editText, setEditText] = useState(ocrText ?? '');

  const handleAdd = async (card: PokemonCard) => {
    await addCard(card.id);
    addToast(t('scanner.addedToCollection', { name: card.name }), 'success');
    onReset();
  };

  const handleReSearch = () => {
    if (editText.trim() && onReSearch) {
      onReSearch(editText.trim());
    }
  };

  if (cards.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-300 font-medium">{t('scanner.noCards')}</p>
          {ocrText && (
            <p className="text-gray-500 text-sm mt-1">{t('scanner.ocrDetected', { text: ocrText })}</p>
          )}
          <p className="text-gray-500 text-sm mt-2">{t('scanner.tryBetter')}</p>
        </div>

        {/* Editable OCR text for retry */}
        {onReSearch && (
          <div className="flex gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReSearch()}
              placeholder={t('scanner.editOcrText')}
              className="flex-1 bg-card-bg border border-card-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <Button size="sm" onClick={handleReSearch}>
              <Search size={14} />
              {t('scanner.reSearch')}
            </Button>
          </div>
        )}

        <Button variant="secondary" size="sm" className="w-full" onClick={onReset}>
          {t('scanner.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Editable OCR text */}
      {onReSearch && (
        <div className="flex gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReSearch()}
            placeholder={t('scanner.editOcrText')}
            className="flex-1 bg-card-bg border border-card-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <Button size="sm" onClick={handleReSearch} variant="secondary">
            <Search size={14} />
          </Button>
        </div>
      )}

      <p className="text-sm text-gray-400">{t('scanner.selectMatch')}</p>

      {cards.map(({ card, confidence, matchMethod }) => (
        <div
          key={card.id}
          className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl p-3 hover:border-accent/50 transition-colors"
        >
          <img
            src={card.images.small}
            alt={card.name}
            className="w-14 rounded-lg shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setCardDetailId(card.id)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold truncate">{card.name}</p>
              <ConfidenceBadge confidence={confidence} t={t} />
            </div>
            <p className="text-gray-400 text-xs">{card.set.name} #{card.number}</p>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {card.types?.map((type) => (
                <Badge key={type} variant="type" type={type} className="text-[10px]">{type}</Badge>
              ))}
              {card.rarity && (
                <Badge variant="outline" className="text-[10px]">{card.rarity}</Badge>
              )}
              <MatchMethodLabel method={matchMethod} t={t} />
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button
              size="sm"
              onClick={() => void handleAdd(card)}
            >
              <Plus size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCardDetailId(card.id)}
            >
              <Eye size={14} />
            </Button>
          </div>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
        {t('scanner.scanAnother')}
      </Button>
    </div>
  );
}
