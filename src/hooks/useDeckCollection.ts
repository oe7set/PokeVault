import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Deck, CollectionOverlay, MissingCardSummary } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';

export function useDeckCollection(deck: Deck | null, cards: Map<string, PokemonCard>) {
  const collection = useLiveQuery(() => db.collection.toArray(), []);

  const collectionMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of collection ?? []) {
      map.set(entry.cardId, entry.quantity + entry.quantityFoil);
    }
    return map;
  }, [collection]);

  const overlays = useMemo<CollectionOverlay[]>(() => {
    if (!deck) return [];
    return deck.cards.map((dc) => {
      const owned = collectionMap.get(dc.cardId) ?? 0;
      const needed = dc.count;
      let status: CollectionOverlay['status'] = 'missing';
      if (owned >= needed) status = 'owned';
      else if (owned > 0) status = 'partial';
      return { cardId: dc.cardId, owned, needed, status };
    });
  }, [deck, collectionMap]);

  const missingCards = useMemo<MissingCardSummary[]>(() => {
    if (!deck) return [];
    return deck.cards
      .map((dc) => {
        const owned = collectionMap.get(dc.cardId) ?? 0;
        const deficit = dc.count - owned;
        if (deficit <= 0) return null;
        const card = cards.get(dc.cardId);
        const price = card?.cardmarket?.prices?.averageSellPrice ?? 0;
        return {
          cardId: dc.cardId,
          name: card?.name ?? dc.cardId,
          needed: dc.count,
          owned,
          deficit,
          estimatedPrice: price * deficit,
        };
      })
      .filter((x): x is MissingCardSummary => x !== null);
  }, [deck, collectionMap, cards]);

  const totalMissing = missingCards.reduce((s, m) => s + m.deficit, 0);
  const totalMissingValue = missingCards.reduce((s, m) => s + m.estimatedPrice, 0);

  return { collectionMap, overlays, missingCards, totalMissing, totalMissingValue };
}
