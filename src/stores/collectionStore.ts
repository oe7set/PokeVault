import { create } from 'zustand';
import { db } from '@/db/database';
import type { CollectionEntry, CardCondition } from '@/types/collection';

interface CollectionStore {
  // Actions
  addCard: (cardId: string, quantity?: number, foil?: boolean, condition?: CardCondition) => Promise<void>;
  removeCard: (cardId: string, quantity?: number, foil?: boolean) => Promise<void>;
  updateEntry: (cardId: string, update: Partial<CollectionEntry>) => Promise<void>;
  toggleWishlist: (cardId: string) => Promise<void>;
  toggleTradeList: (cardId: string) => Promise<void>;
  getEntry: (cardId: string) => Promise<CollectionEntry | null>;
}

export const useCollectionStore = create<CollectionStore>(() => ({
  addCard: async (cardId, quantity = 1, foil = false, condition = 'NM') => {
    const existing = await db.collection.where('cardId').equals(cardId).first();
    if (existing) {
      if (foil) {
        await db.collection.update(existing.id!, {
          quantityFoil: existing.quantityFoil + quantity,
        });
      } else {
        await db.collection.update(existing.id!, {
          quantity: existing.quantity + quantity,
        });
      }
    } else {
      await db.collection.add({
        cardId,
        quantity: foil ? 0 : quantity,
        quantityFoil: foil ? quantity : 0,
        condition,
        addedAt: new Date().toISOString(),
        inWishlist: false,
        inTradeList: false,
      });
    }
  },

  removeCard: async (cardId, quantity = 1, foil = false) => {
    const existing = await db.collection.where('cardId').equals(cardId).first();
    if (!existing) return;

    if (foil) {
      const newQty = Math.max(0, existing.quantityFoil - quantity);
      if (newQty === 0 && existing.quantity === 0) {
        await db.collection.delete(existing.id!);
      } else {
        await db.collection.update(existing.id!, { quantityFoil: newQty });
      }
    } else {
      const newQty = Math.max(0, existing.quantity - quantity);
      if (newQty === 0 && existing.quantityFoil === 0) {
        await db.collection.delete(existing.id!);
      } else {
        await db.collection.update(existing.id!, { quantity: newQty });
      }
    }
  },

  updateEntry: async (cardId, update) => {
    const existing = await db.collection.where('cardId').equals(cardId).first();
    if (existing) {
      await db.collection.update(existing.id!, update);
    }
  },

  toggleWishlist: async (cardId) => {
    const existing = await db.collection.where('cardId').equals(cardId).first();
    if (existing) {
      await db.collection.update(existing.id!, { inWishlist: !existing.inWishlist });
    } else {
      await db.collection.add({
        cardId,
        quantity: 0,
        quantityFoil: 0,
        condition: 'NM',
        addedAt: new Date().toISOString(),
        inWishlist: true,
        inTradeList: false,
      });
    }
  },

  toggleTradeList: async (cardId) => {
    const existing = await db.collection.where('cardId').equals(cardId).first();
    if (existing) {
      await db.collection.update(existing.id!, { inTradeList: !existing.inTradeList });
    }
  },

  getEntry: async (cardId) => {
    return (await db.collection.where('cardId').equals(cardId).first()) ?? null;
  },
}));
