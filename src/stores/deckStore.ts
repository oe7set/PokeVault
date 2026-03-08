import { create } from 'zustand';
import { db } from '@/db/database';
import type { Deck, DeckCard, DeckFormat } from '@/types/deck';

interface DeckStore {
  activeDeckId: number | null;
  setActiveDeck: (id: number | null) => void;

  createDeck: (name: string, format: DeckFormat) => Promise<number>;
  updateDeck: (id: number, update: Partial<Deck>) => Promise<void>;
  deleteDeck: (id: number) => Promise<void>;
  duplicateDeck: (id: number) => Promise<number>;

  addCardToDeck: (deckId: number, cardId: string, count?: number) => Promise<void>;
  removeCardFromDeck: (deckId: number, cardId: string) => Promise<void>;
  setCardCount: (deckId: number, cardId: string, count: number) => Promise<void>;
  clearDeck: (deckId: number) => Promise<void>;
}

export const useDeckStore = create<DeckStore>((set) => ({
  activeDeckId: null,

  setActiveDeck: (id) => set({ activeDeckId: id }),

  createDeck: async (name, format) => {
    const now = new Date().toISOString();
    const id = await db.decks.add({
      name,
      format,
      cards: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
    return id as number;
  },

  updateDeck: async (id, update) => {
    await db.decks.update(id, { ...update, updatedAt: new Date().toISOString() });
  },

  deleteDeck: async (id) => {
    await db.decks.delete(id);
  },

  duplicateDeck: async (id) => {
    const deck = await db.decks.get(id);
    if (!deck) throw new Error('Deck not found');
    const now = new Date().toISOString();
    const newId = await db.decks.add({
      ...deck,
      id: undefined,
      name: `${deck.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    });
    return newId as number;
  },

  addCardToDeck: async (deckId, cardId, count = 1) => {
    const deck = await db.decks.get(deckId);
    if (!deck) return;

    const existing = deck.cards.find((c) => c.cardId === cardId);
    let newCards: DeckCard[];

    if (existing) {
      newCards = deck.cards.map((c) =>
        c.cardId === cardId ? { ...c, count: c.count + count } : c,
      );
    } else {
      newCards = [...deck.cards, { cardId, count }];
    }

    await db.decks.update(deckId, { cards: newCards, updatedAt: new Date().toISOString() });
  },

  removeCardFromDeck: async (deckId, cardId) => {
    const deck = await db.decks.get(deckId);
    if (!deck) return;

    const newCards = deck.cards.filter((c) => c.cardId !== cardId);
    await db.decks.update(deckId, { cards: newCards, updatedAt: new Date().toISOString() });
  },

  setCardCount: async (deckId, cardId, count) => {
    const deck = await db.decks.get(deckId);
    if (!deck) return;

    let newCards: DeckCard[];
    if (count <= 0) {
      newCards = deck.cards.filter((c) => c.cardId !== cardId);
    } else {
      const existing = deck.cards.find((c) => c.cardId === cardId);
      if (existing) {
        newCards = deck.cards.map((c) => (c.cardId === cardId ? { ...c, count } : c));
      } else {
        newCards = [...deck.cards, { cardId, count }];
      }
    }

    await db.decks.update(deckId, { cards: newCards, updatedAt: new Date().toISOString() });
  },

  clearDeck: async (deckId) => {
    await db.decks.update(deckId, { cards: [], updatedAt: new Date().toISOString() });
  },
}));
