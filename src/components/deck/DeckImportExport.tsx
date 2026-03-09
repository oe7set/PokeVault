import { useState } from 'react';
import { Download, Upload, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Deck } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';
import { exportToPTCGLFormat, parsePTCGLFormat, copyToClipboard } from '@/utils/ptcglFormat';
import { searchCards } from '@/api/cardApi';
import { useUIStore } from '@/stores/uiStore';
import { useDeckStore } from '@/stores/deckStore';
import type { SearchFilters } from '@/types/pokemon';
import { useTranslation } from '@/i18n/LanguageContext';

interface DeckImportExportProps {
  deck: Deck;
  cardsMap: Map<string, PokemonCard>;
}

export function DeckImportExport({ deck, cardsMap }: DeckImportExportProps) {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useUIStore();
  const { setCardCount } = useDeckStore();

  const handleExport = async () => {
    const text = exportToPTCGLFormat(deck, cardsMap);
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast(t('importExport.deckCopied'), 'success');
  };

  const handleImport = async () => {
    if (!deck.id || !importText.trim()) return;
    setImporting(true);

    try {
      const parsed = parsePTCGLFormat(importText);

      for (const pc of parsed) {
        // Search for the card by name and set
        const filters: SearchFilters = {
          query: pc.name,
          types: [],
          supertypes: [],
          subtypes: [],
          setId: '',
          rarity: '',
          format: 'all',
        };

        const result = await searchCards(filters, 1, 5);
        const match = result.data.find(
          (c) =>
            c.name.toLowerCase() === pc.name.toLowerCase() &&
            (c.number === pc.number || c.set.id.toUpperCase() === pc.setCode),
        ) ?? result.data[0];

        if (match && deck.id) {
          await setCardCount(deck.id, match.id, pc.count);
        }
      }

      addToast(t('importExport.imported', { count: parsed.length }), 'success');
      setShowImport(false);
      setImportText('');
    } catch {
      addToast(t('importExport.importFailed'), 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => void handleExport()} className="flex-1">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t('importExport.copied') : t('importExport.export')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowImport(true)} className="flex-1">
          <Upload size={14} />
          {t('importExport.import')}
        </Button>
      </div>

      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title={t('importExport.importDeck')} size="md">
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-400">
            {t('importExport.importHint')} <code className="text-gray-300">4 Charizard ex OBF 125</code>
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="4 Charizard ex OBF 125&#10;2 Arcanine ex OBF 29&#10;4 Fire Energy 1&#10;..."
            className="w-full h-48 bg-card-border/50 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent font-mono resize-none"
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowImport(false)} className="flex-1">
              {t('importExport.cancel')}
            </Button>
            <Button size="sm" loading={importing} onClick={() => void handleImport()} className="flex-1">
              <Download size={14} />
              {t('importExport.importCards')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
