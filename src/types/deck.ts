import type { PokemonCard } from './pokemon';

export type DeckFormat = 'standard' | 'expanded' | 'unlimited';

export interface DeckCard {
  cardId: string;
  count: number;
  card?: PokemonCard;
}

export interface Deck {
  id?: number;
  name: string;
  format: DeckFormat;
  description?: string;
  cards: DeckCard[];
  coverCardId?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface DeckValidationResult {
  valid: boolean;
  totalCards: number;
  errors: string[];
  warnings: string[];
}

export interface DeckStats {
  totalCards: number;
  pokemon: number;
  trainers: number;
  energy: number;
  avgAttackCost: number;
  typeDistribution: Record<string, number>;
  energyCurve: { cost: number; count: number }[];
  weaknesses: string[];
  resistances: string[];
}

export interface AISuggestion {
  card: string;
  reason: string;
  category: 'draw' | 'search' | 'energy' | 'tech' | 'pokemon' | 'removal';
  priority: 'high' | 'medium' | 'low';
}

export interface AIAdvice {
  summary: string;
  suggestions: AISuggestion[];
  winCondition?: string;
  weaknesses?: string[];
  strengths?: string[];
}
