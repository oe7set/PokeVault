export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'D';

export const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  D: 'Damaged',
};

export interface CollectionEntry {
  id?: number;
  cardId: string;
  quantity: number;
  quantityFoil: number;
  condition: CardCondition;
  notes?: string;
  addedAt: string;
  inWishlist: boolean;
  inTradeList: boolean;
}

export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  totalFoils: number;
  byType: Record<string, number>;
  bySupertype: Record<string, number>;
  bySet: Record<string, { owned: number; total: number; name: string }>;
}
