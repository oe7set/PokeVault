import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, ArrowLeft, Sparkles, BarChart2, Download, Library, Hand, AlertTriangle, Layers, X, LayoutGrid } from 'lucide-react';
import { db } from '@/db/database';
import { useDeckStore } from '@/stores/deckStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useUIStore } from '@/stores/uiStore';
import { useCardSearch } from '@/hooks/useCardSearch';
import { useDeckWithCards } from '@/hooks/useDeckValidation';
import { useDeckCollection } from '@/hooks/useDeckCollection';
import { getCards } from '@/api/cardApi';
import type { PokemonCard } from '@/types/pokemon';
import type { DeckFormat } from '@/types/deck';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardFilters } from '@/components/cards/CardFilters';
import { ViewModeToggle } from '@/components/cards/ViewModeToggle';
import { DeckValidator } from '@/components/deck/DeckValidator';
import { DeckStatsPanel } from '@/components/deck/DeckStatsPanel';
import { AIAdvisorPanel } from '@/components/deck/AIAdvisorPanel';
import { DeckImportExport } from '@/components/deck/DeckImportExport';
import { DeckCardRow } from '@/components/deck/DeckCardRow';
import { HandSimulator } from '@/components/deck/HandSimulator';
import { Spinner } from '@/components/ui/Spinner';
import { clsx } from 'clsx';
import { useTranslation } from '@/i18n/LanguageContext';

type SidePanel = 'deck' | 'cards' | 'collection' | 'stats' | 'hand' | 'ai' | 'export';

export function DeckBuilder() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addCardToDeck, removeCardFromDeck, setCardCount, updateDeck } = useDeckStore();
  const { addToWishlist } = useCollectionStore();
  const { addToast, setCardDetailId, cardViewMode } = useUIStore();
  const [sidePanel, setSidePanel] = useState<SidePanel>('deck');
  const [deckSearchQuery, setDeckSearchQuery] = useState('');
  const [deckTypeFilter, setDeckTypeFilter] = useState<string>('all');
  const [showDeckPanel, setShowDeckPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deckCards, setDeckCards] = useState<Map<string, PokemonCard>>(new Map());

  const deckId = parseInt(id ?? '0', 10);
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  const { cardsMap, validation, stats } = useDeckWithCards(deck ?? null);
  const { collectionMap, overlays, missingCards, totalMissing, totalMissingValue } = useDeckCollection(deck ?? null, deckCards);

  const { results, loading: searchLoading, filters, updateFilters } = useCardSearch();

  // Collection cards for "Collection" tab
  const collectionEntries = useLiveQuery(() => db.collection.toArray(), []);
  const [collectionCards, setCollectionCards] = useState<PokemonCard[]>([]);

  useEffect(() => {
    if (!collectionEntries?.length) {
      setCollectionCards([]);
      return;
    }
    const ids = collectionEntries.filter((e) => e.quantity + e.quantityFoil > 0).map((e) => e.cardId);
    if (ids.length === 0) { setCollectionCards([]); return; }
    void getCards(ids).then(setCollectionCards);
  }, [collectionEntries]);

  // Filter collection cards by search query
  const filteredCollectionCards = useMemo(() => {
    if (!searchQuery.trim()) return collectionCards;
    const q = searchQuery.toLowerCase();
    return collectionCards.filter((c) => c.name.toLowerCase().includes(q));
  }, [collectionCards, searchQuery]);

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

  // Build overlay map for quick lookup
  const overlayMap = useMemo(() => {
    const map = new Map<string, (typeof overlays)[number]>();
    for (const o of overlays) map.set(o.cardId, o);
    return map;
  }, [overlays]);

  // Group deck cards by supertype
  const groupedDeckCards = useMemo(() => {
    if (!deck) return { 'Pokémon': [], 'Trainer': [], 'Energy': [] } as Record<string, { cardId: string; count: number }[]>;
    const groups: Record<string, typeof deck.cards> = { 'Pokémon': [], 'Trainer': [], 'Energy': [] };
    for (const dc of deck.cards) {
      const card = deckCards.get(dc.cardId);
      const type = card?.supertype ?? 'Other';
      const key = type === 'Trainer' ? 'Trainer' : type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(dc);
    }
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck?.cards, deckCards]);

  // Filtered deck cards for the "Deck" tab
  const filteredDeckCards = useMemo(() => {
    if (!deck) return [];
    const allCards = Array.from(deckCards.values()).filter((c) =>
      deck.cards.some((dc) => dc.cardId === c.id),
    );
    let filtered = allCards;
    if (deckTypeFilter !== 'all') {
      filtered = filtered.filter((c) => c.supertype === deckTypeFilter);
    }
    if (deckSearchQuery.trim()) {
      const q = deckSearchQuery.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [deck, deckCards, deckTypeFilter, deckSearchQuery]);

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

    const isBasicEnergy = card.supertype === 'Energy' && card.subtypes?.includes('Basic');
    if (!isBasicEnergy && currentCount >= 4) {
      addToast(t('deckBuilder.maxCopies', { name: card.name }), 'error');
      return;
    }

    await addCardToDeck(deckId, card.id);
    setDeckCards((prev) => new Map(prev).set(card.id, card));

    // Auto-wishlist only if collection doesn't cover the new deck count
    const owned = collectionMap.get(card.id) ?? 0;
    const newCount = currentCount + 1;
    if (owned < newCount) {
      await addToWishlist(card.id);
    }
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

  const handleSetCount = async (cardId: string, count: number) => {
    const card = deckCards.get(cardId);
    if (!card) return;
    const isBasicEnergy = card.supertype === 'Energy' && card.subtypes?.includes('Basic');
    if (!isBasicEnergy && count > 4) return;
    if (count <= 0) {
      await removeCardFromDeck(deckId, cardId);
    } else {
      await setCardCount(deckId, cardId, count);
    }
  };

  const totalCards = deck.cards.reduce((s, dc) => s + dc.count, 0);

  const tabs = [
    { key: 'deck' as const, icon: LayoutGrid, label: t('deckBuilder.deckView') },
    { key: 'cards' as const, icon: Search, label: t('deckBuilder.cards') },
    { key: 'collection' as const, icon: Library, label: t('deckBuilder.collection') },
    { key: 'stats' as const, icon: BarChart2, label: t('deckBuilder.stats') },
    { key: 'hand' as const, icon: Hand, label: t('deckBuilder.hand') },
    { key: 'ai' as const, icon: Sparkles, label: t('deckBuilder.aiTips') },
    { key: 'export' as const, icon: Download, label: t('deckBuilder.export') },
  ];

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-card-border sticky top-0 bg-surface-50 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/decks')}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('deckBuilder.backToDecks')}
          </button>
          <button
            onClick={() => setShowDeckPanel(false)}
            className="md:hidden text-gray-400 hover:text-white mb-3"
          >
            <X size={18} />
          </button>
        </div>
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

      {/* Missing cards banner */}
      {totalMissing > 0 && (
        <button
          onClick={() => { setSidePanel('stats'); setShowDeckPanel(false); }}
          className="mx-4 mt-2 flex items-center gap-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2 text-left hover:bg-yellow-900/30 transition-colors"
        >
          <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
          <span className="text-[10px] text-yellow-300">
            {t('deckBuilder.missing', { count: totalMissing })} {totalMissingValue > 0 && `(~$${totalMissingValue.toFixed(2)})`}
          </span>
        </button>
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
                {deckCardList.map((dc) => (
                  <DeckCardRow
                    key={dc.cardId}
                    cardId={dc.cardId}
                    count={dc.count}
                    card={deckCards.get(dc.cardId)}
                    overlay={overlayMap.get(dc.cardId)}
                    onAdd={() => {
                      const card = deckCards.get(dc.cardId);
                      if (card) void handleAddCard(card);
                    }}
                    onRemove={() => void handleRemoveCard(dc.cardId)}
                    onSetCount={(n) => void handleSetCount(dc.cardId, n)}
                    onCardClick={() => setCardDetailId(dc.cardId)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {deck.cards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">{t('deckBuilder.emptyDeck')}</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Mobile: Deck toggle bar */}
      <button
        onClick={() => setShowDeckPanel(true)}
        className="md:hidden flex items-center gap-2 bg-surface-50 border-b border-card-border px-4 py-3 shrink-0"
      >
        <Layers size={16} className="text-accent" />
        <span className="text-white text-sm font-medium truncate">{deck.name}</span>
        <span className={clsx('text-xs font-bold ml-auto', totalCards === 60 ? 'text-green-400' : 'text-accent')}>
          {totalCards}/60
        </span>
      </button>

      {/* Mobile: Deck drawer overlay */}
      {showDeckPanel && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeckPanel(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] flex flex-col bg-surface-50 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop: Deck sidebar */}
      <div className="hidden md:flex md:w-72 md:shrink-0 flex-col border-r border-card-border bg-surface-50 overflow-y-auto">
        {sidebarContent}
      </div>

      {/* Right: Panels */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Panel tabs */}
        <div className="flex border-b border-card-border bg-[#0d0d1a] shrink-0 overflow-x-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSidePanel(key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
                sidePanel === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-300',
              )}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {sidePanel === 'deck' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={deckSearchQuery}
                  onChange={(e) => setDeckSearchQuery(e.target.value)}
                  placeholder={t('deckBuilder.filterDeckCards')}
                  className="w-full bg-card-bg border border-card-border text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accent text-sm"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {['all', 'Pokémon', 'Trainer', 'Energy'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setDeckTypeFilter(type)}
                      className={clsx(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        deckTypeFilter === type
                          ? 'bg-accent text-white'
                          : 'bg-card-border text-gray-400 hover:text-white',
                      )}
                    >
                      {type === 'all' ? t('collection.all') : type}
                    </button>
                  ))}
                </div>
                <ViewModeToggle />
              </div>
              {filteredDeckCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">{deck.cards.length === 0 ? t('deckBuilder.emptyDeck') : t('deckBuilder.noCardsMatch')}</p>
                </div>
              ) : (
                <CardGrid
                  cards={filteredDeckCards}
                  loading={false}
                  columns={5}
                  viewMode={cardViewMode}
                />
              )}
            </div>
          )}

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
                  placeholder={t('deckBuilder.searchCards')}
                  className="w-full bg-card-bg border border-card-border text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accent text-sm"
                />
              </div>
              <CardFilters
                filters={filters}
                onChange={updateFilters}
                onReset={() => {
                  setSearchQuery('');
                  updateFilters({ query: '', types: [], supertypes: [], subtypes: [], setId: '', rarity: '', format: 'all' });
                }}
              />
              <CardGrid
                cards={results?.data ?? []}
                loading={searchLoading}
                onAddToDeck={handleAddCard}
                columns={5}
                compact={false}
              />
            </div>
          )}

          {sidePanel === 'collection' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('deckBuilder.filterCollection')}
                  className="w-full bg-card-bg border border-card-border text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accent text-sm"
                />
              </div>
              {filteredCollectionCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">
                    {collectionCards.length === 0
                      ? t('deckBuilder.collectionEmpty')
                      : t('deckBuilder.noCardsMatch')}
                  </p>
                </div>
              ) : (
                <CardGrid
                  cards={filteredCollectionCards}
                  loading={false}
                  onAddToDeck={handleAddCard}
                  columns={5}
                  compact={false}
                />
              )}
            </div>
          )}

          {sidePanel === 'stats' && stats && (
            <div className="max-w-md">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">{t('deckBuilder.deckAnalysis')}</h3>
              <DeckStatsPanel
                stats={stats}
                deck={deck}
                missingCards={missingCards}
                totalMissingValue={totalMissingValue}
              />
            </div>
          )}

          {sidePanel === 'hand' && (
            <div className="max-w-lg">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">{t('deckBuilder.openingHandSim')}</h3>
              <HandSimulator deckCards={deck.cards} cards={deckCards.size > 0 ? deckCards : cardsMap} />
            </div>
          )}

          {sidePanel === 'ai' && (
            <div className="max-w-md">
              <AIAdvisorPanel deck={deck} cardsMap={cardsMap.size > 0 ? cardsMap : deckCards} />
            </div>
          )}

          {sidePanel === 'export' && (
            <div className="max-w-md space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">{t('deckBuilder.importExport')}</h3>
              <DeckImportExport deck={deck} cardsMap={deckCards} />

              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('deckBuilder.deckDescription')}</label>
                <textarea
                  value={deck.description ?? ''}
                  onChange={(e) => void updateDeck(deckId, { description: e.target.value })}
                  placeholder={t('deckBuilder.descriptionPlaceholder')}
                  className="w-full bg-card-border/50 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('deckBuilder.tags')}</label>
                <input
                  type="text"
                  value={deck.tags.join(', ')}
                  onChange={(e) =>
                    void updateDeck(deckId, {
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder={t('deckBuilder.tagsPlaceholder')}
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
