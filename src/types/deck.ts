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
  supporters: number;
  items: number;
  tools: number;
  stadiums: number;
  avgAttackCost: number;
  typeDistribution: Record<string, number>;
  energyCurve: { cost: number; count: number }[];
  weaknesses: string[];
  resistances: string[];
  openingHandProbabilities: { cardId: string; name: string; count: number; probability: number }[];
  consistencyScore: number;
  evolutionLines: EvolutionLine[];
  energyToAttackerRatio: number;
  estimatedValue: number;
  cardPrices: { cardId: string; name: string; price: number; count: number }[];
}

export interface EvolutionLine {
  stages: { name: string; count: number; stage: string }[];
  complete: boolean;
}

export interface CollectionOverlay {
  cardId: string;
  owned: number;
  needed: number;
  status: 'owned' | 'partial' | 'missing';
}

export interface MissingCardSummary {
  cardId: string;
  name: string;
  needed: number;
  owned: number;
  deficit: number;
  estimatedPrice: number;
}

export interface HandSimulationResult {
  hand: string[];
  isMulligan: boolean;
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
