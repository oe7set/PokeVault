import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Filter, Heart, ArrowLeftRight, BookOpen } from 'lucide-react';
import { db } from '@/db/database';
import { getCards } from '@/api/pokemonTcg';
import type { PokemonCard } from '@/types/pokemon';
import { CollectionStats } from '@/components/collection/CollectionStats';
import { CardGrid } from '@/components/cards/CardGrid';
import { AddCardModal } from '@/components/collection/AddCardModal';
import { clsx } from 'clsx';

type ViewFilter = 'all' | 'owned' | 'wishlist' | 'tradelist';

export function Collection() {
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);

  const entries = useLiveQuery(() => db.collection.toArray(), []);

  useEffect(() => {
    if (!entries || entries.length === 0) {
      setCards([]);
      return;
    }

    let filtered = entries;
    if (viewFilter === 'owned') filtered = entries.filter((e) => e.quantity > 0 || e.quantityFoil > 0);
    if (viewFilter === 'wishlist') filtered = entries.filter((e) => e.inWishlist);
    if (viewFilter === 'tradelist') filtered = entries.filter((e) => e.inTradeList);

    const ids = filtered.map((e) => e.cardId);
    if (ids.length === 0) { setCards([]); return; }

    setLoading(true);
    void getCards(ids)
      .then((fetched) => setCards(fetched))
      .finally(() => setLoading(false));
  }, [entries, viewFilter]);

  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter((c) => c.name.toLowerCase().includes(q) || c.set.name.toLowerCase().includes(q));
  }, [cards, searchQuery]);

  const filterButtons: { key: ViewFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <BookOpen size={14} /> },
    { key: 'owned', label: 'Owned', icon: <Filter size={14} /> },
    { key: 'wishlist', label: 'Wishlist', icon: <Heart size={14} /> },
    { key: 'tradelist', label: 'Trade', icon: <ArrowLeftRight size={14} /> },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">My Collection</h1>
        <p className="text-gray-400 text-sm">{(entries?.length ?? 0).toLocaleString()} cards tracked</p>
      </div>

      {/* Stats */}
      <CollectionStats />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filterButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setViewFilter(key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              viewFilter === key
                ? 'bg-accent text-white'
                : 'bg-card-border text-gray-400 hover:text-white',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter collection..."
          className="w-full bg-card-bg border border-card-border text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accent text-sm"
        />
      </div>

      {/* Empty state */}
      {!loading && filteredCards.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-lg">
            {entries?.length === 0 ? 'Your collection is empty' : 'No cards match this filter'}
          </p>
          <p className="text-sm mt-1">
            {entries?.length === 0
              ? 'Browse cards and add them to start building your collection'
              : 'Try a different filter or search term'}
          </p>
        </div>
      )}

      {/* Card grid */}
      <CardGrid
        cards={filteredCards}
        loading={loading}
      />

      <AddCardModal />
    </div>
  );
}
