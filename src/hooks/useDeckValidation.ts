import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Deck } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';
import { validateDeck } from '@/utils/deckValidation';
import { analyzeDeck } from '@/utils/deckAnalysis';

export function useDeckWithCards(deck: Deck | null) {
  const cardIds = deck?.cards.map((c) => c.cardId) ?? [];

  const cachedCards = useLiveQuery(
    async () => {
      if (cardIds.length === 0) return [];
      return db.cards_cache
        .where('id')
        .anyOf(cardIds)
        .toArray();
    },
    [cardIds.join(',')],
    [],
  );

  const cardsMap = useMemo(() => {
    const map = new Map<string, PokemonCard>();
    for (const c of cachedCards ?? []) {
      map.set(c.id, c.data);
    }
    return map;
  }, [cachedCards]);

  const validation = useMemo(() => {
    if (!deck) return null;
    return validateDeck(deck, cardsMap);
  }, [deck, cardsMap]);

  const stats = useMemo(() => {
    if (!deck) return null;
    return analyzeDeck(deck, cardsMap);
  }, [deck, cardsMap]);

  return { cardsMap, validation, stats };
}
