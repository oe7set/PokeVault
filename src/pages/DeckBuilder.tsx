import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, ArrowLeft, Plus, Minus, Sparkles, BarChart2, Download } from 'lucide-react';
import { db } from '@/db/database';
import { useDeckStore } from '@/stores/deckStore';
import { useUIStore } from '@/stores/uiStore';
import { useCardSearch } from '@/hooks/useCardSearch';
import { useDeckWithCards } from '@/hooks/useDeckValidation';
import { getCards } from '@/api/pokemonTcg';
import type { PokemonCard } from '@/types/pokemon';
import type { DeckFormat } from '@/types/deck';
import { CardGrid } from '@/components/cards/CardGrid';
import { DeckValidator } from '@/components/deck/DeckValidator';
import { DeckStatsPanel } from '@/components/deck/DeckStatsPanel';
import { AIAdvisorPanel } from '@/components/deck/AIAdvisorPanel';
import { DeckImportExport } from '@/components/deck/DeckImportExport';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { clsx } from 'clsx';

type SidePanel = 'cards' | 'stats' | 'ai' | 'export';

export function DeckBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addCardToDeck, removeCardFromDeck, setCardCount, updateDeck } = useDeckStore();
  const { addToast } = useUIStore();
  const [sidePanel, setSidePanel] = useState<SidePanel>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [deckCards, setDeckCards] = useState<Map<string, PokemonCard>>(new Map());

  const deckId = parseInt(id ?? '0', 10);
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  const { cardsMap, validation, stats } = useDeckWithCards(deck ?? null);

  const { results, loading: searchLoading, updateFilters } = useCardSearch();

  // Load deck cards
  useEffect(() => {
    if (!deck?.cards?.length) return;
    const ids = deck.cards.map((c) => c.cardId);
    void getCards(ids).then((fetched) => {
      const map = new Map<string, PokemonCard>();
      for (const c of fetched) map.set(c.id, c);
      setDeckCards(map);
    });
  }, [deck]);

  // Initial search
  useEffect(() => {
    updateFilters({ query: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!deck) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleAddCard = async (card: PokemonCard) => {
    const existing = deck.cards.find((c) => c.cardId === card.id);
    const currentCount = existing?.count ?? 0;

    // Enforce 4-copy rule (with basic energy exception)
    const isBasicEnergy = card.supertype === 'Energy' && card.subtypes?.includes('Basic');
    if (!isBasicEnergy && currentCount >= 4) {
      addToast(`Max 4 copies of ${card.name} allowed`, 'error');
      return;
    }

    await addCardToDeck(deckId, card.id);
    setDeckCards((prev) => new Map(prev).set(card.id, card));
  };

  const handleRemoveCard = async (cardId: string) => {
    const existing = deck.cards.find((c) => c.cardId === cardId);
    if (!existing) return;
    if (existing.count <= 1) {
      await removeCardFromDeck(deckId, cardId);
    } else {
      await setCardCount(deckId, cardId, existing.count - 1);
    }
  };

  const totalCards = deck.cards.reduce((s, dc) => s + dc.count, 0);

  // Group deck cards by supertype
  const groupedDeckCards = useMemo(() => {
    const groups: Record<string, typeof deck.cards> = { 'Pokémon': [], 'Trainer': [], 'Energy': [] };
    for (const dc of deck.cards) {
      const card = deckCards.get(dc.cardId);
      const type = card?.supertype ?? 'Other';
      const key = type === 'Trainer' ? 'Trainer' : type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(dc);
    }
    return groups;
  }, [deck.cards, deckCards]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Deck List */}
      <div className="w-72 shrink-0 flex flex-col border-r border-card-border bg-surface-50 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-card-border sticky top-0 bg-surface-50 z-10">
          <button
            onClick={() => navigate('/decks')}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Decks
          </button>
          <input
            value={deck.name}
            onChange={(e) => void updateDeck(deckId, { name: e.target.value })}
            className="w-full bg-transparent text-white font-bold text-lg focus:outline-none border-b border-transparent focus:border-accent pb-1"
          />
          <div className="flex items-center gap-2 mt-1">
            <select
              value={deck.format}
              onChange={(e) => void updateDeck(deckId, { format: e.target.value as DeckFormat })}
              className="bg-card-border text-gray-300 text-xs rounded px-2 py-1 focus:outline-none"
            >
              <option value="standard">Standard</option>
              <option value="expanded">Expanded</option>
              <option value="unlimited">Unlimited</option>
            </select>
            <span className={clsx('text-xs font-bold', totalCards === 60 ? 'text-green-400' : 'text-accent')}>
              {totalCards}/60
            </span>
          </div>
        </div>

        {/* Validation */}
        {validation && (
          <div className="px-4 py-3 border-b border-card-border">
            <DeckValidator validation={validation} />
          </div>
        )}

        {/* Deck Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {Object.entries(groupedDeckCards).map(([supertype, deckCardList]) => {
            if (deckCardList.length === 0) return null;
            const count = deckCardList.reduce((s, dc) => s + dc.count, 0);
            return (
              <div key={supertype}>
                <p className="text-xs text-gray-500 font-semibold mb-1.5 flex justify-between">
                  <span>{supertype}</span>
                  <span>{count}</span>
                </p>
                <div className="space-y-1">
                  {deckCardList.map((dc) => {
                    const card = deckCards.get(dc.cardId);
                    return (
                      <div
                        key={dc.cardId}
                        className="flex items-center gap-2 bg-card-bg/60 rounded-lg px-2 py-1.5 group"
                      >
                        {card?.images.small && (
                          <img src={card.images.small} alt={card.name} className="w-7 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{card?.name ?? dc.cardId}</p>
                          {card?.types && (
                            <div className="flex gap-0.5 mt-0.5">
                              {card.types.map((t) => (
                                <Badge key={t} variant="type" type={t} className="text-[9px]">{t}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => void handleRemoveCard(dc.cardId)} className="text-gray-400 hover:text-red-400 transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="text-white text-xs font-bold w-4 text-center">{dc.count}</span>
                          <button onClick={() => card && void handleAddCard(card)} className="text-gray-400 hover:text-green-400 transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>
                        {!deckCards.get(dc.cardId) && (
                          <span className="text-accent font-bold text-xs">{dc.count}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {deck.cards.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">🃏</p>
              <p className="text-sm">Search cards and add them to your deck</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Card Search + Panels */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Panel tabs */}
        <div className="flex border-b border-card-border bg-[#0d0d1a] shrink-0">
          {([
            { key: 'cards', icon: Search, label: 'Cards' },
            { key: 'stats', icon: BarChart2, label: 'Stats' },
            { key: 'ai', icon: Sparkles, label: 'AI Tips' },
            { key: 'export', icon: Download, label: 'Export' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSidePanel(key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                sidePanel === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-300',
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidePanel === 'cards' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    updateFilters({ query: e.target.value });
                  }}
                  placeholder="Search cards to add..."
                  className="w-full bg-card-bg border border-card-border text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accent text-sm"
                />
              </div>
              <CardGrid
                cards={results?.data ?? []}
                loading={searchLoading}
                onAddToDeck={handleAddCard}
                columns={5}
                compact={false}
              />
            </div>
          )}

          {sidePanel === 'stats' && stats && (
            <div className="max-w-md">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Deck Analysis</h3>
              <DeckStatsPanel stats={stats} />
            </div>
          )}

          {sidePanel === 'ai' && (
            <div className="max-w-md">
              <AIAdvisorPanel deck={deck} cardsMap={cardsMap.size > 0 ? cardsMap : deckCards} />
            </div>
          )}

          {sidePanel === 'export' && (
            <div className="max-w-md space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Import / Export</h3>
              <DeckImportExport deck={deck} cardsMap={deckCards} />

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Deck Description</label>
                <textarea
                  value={deck.description ?? ''}
                  onChange={(e) => void updateDeck(deckId, { description: e.target.value })}
                  placeholder="Describe your deck strategy..."
                  className="w-full bg-card-border/50 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent resize-none"
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tags (comma separated)</label>
                <input
                  type="text"
                  value={deck.tags.join(', ')}
                  onChange={(e) =>
                    void updateDeck(deckId, {
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. Fire, Control, Meta"
                  className="w-full bg-card-border/50 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
