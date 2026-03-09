/**
 * Scanner orchestration engine: preprocessing -> OCR -> cleaning -> multi-strategy search -> ranking.
 */

import { preprocessForOCR } from './imagePreprocessing';
import { cleanOCRText, generateSearchVariants, fuzzyMatchScore } from './fuzzyMatch';
import { searchCards } from '@/api/cardApi';
import type { PokemonCard, SearchFilters } from '@/types/pokemon';

export type ScanStep = 'preprocessing' | 'ocr' | 'analyzing' | 'searching' | 'ranking' | 'done';

export interface ScoredCard {
  card: PokemonCard;
  confidence: number;
  matchMethod: 'exact' | 'fuzzy' | 'variant';
}

export interface ScanResult {
  cards: ScoredCard[];
  ocrCandidates: string[];
  bestQuery: string;
}

function makeFilters(query: string): SearchFilters {
  return {
    query: query.slice(0, 40),
    types: [],
    supertypes: [],
    subtypes: [],
    setId: '',
    rarity: '',
    format: 'all',
  };
}

async function searchWithQuery(query: string): Promise<PokemonCard[]> {
  if (!query.trim()) return [];
  try {
    const result = await searchCards(makeFilters(query), 1, 10);
    return result.data;
  } catch {
    return [];
  }
}

export async function scanCard(
  imageDataUrl: string,
  onProgress: (step: ScanStep) => void,
): Promise<ScanResult> {
  // Step 1: Preprocessing
  onProgress('preprocessing');
  const preprocessed = await preprocessForOCR(imageDataUrl);

  // Step 2: OCR on all variants
  onProgress('ocr');
  const Tesseract = await import('tesseract.js');
  const ocrTexts: string[] = [];

  for (const imgData of preprocessed) {
    try {
      const result = await Tesseract.recognize(imgData, 'eng', {
        logger: () => {},
      });
      const text = result.data.text.trim();
      if (text) ocrTexts.push(text);
    } catch {
      // skip failed OCR
    }
  }

  // Step 3: Analyze and clean OCR text
  onProgress('analyzing');
  const combinedText = ocrTexts.join('\n');
  const candidates = cleanOCRText(combinedText);

  if (candidates.length === 0) {
    onProgress('done');
    return { cards: [], ocrCandidates: [], bestQuery: '' };
  }

  // Step 4: Multi-strategy search
  onProgress('searching');
  const allResults = new Map<string, { card: PokemonCard; confidence: number; matchMethod: ScoredCard['matchMethod'] }>();
  let bestQuery = candidates[0];

  for (const candidate of candidates) {
    // Strategy 1: Exact search with full candidate
    const exactResults = await searchWithQuery(candidate);
    for (const card of exactResults) {
      const score = fuzzyMatchScore(candidate, card.name);
      const existing = allResults.get(card.id);
      if (!existing || existing.confidence < score) {
        allResults.set(card.id, { card, confidence: score, matchMethod: 'exact' });
      }
    }

    // If we already have good matches, skip further strategies for this candidate
    const highConfidenceCount = Array.from(allResults.values()).filter((r) => r.confidence > 0.7).length;
    if (highConfidenceCount >= 3) continue;

    // Strategy 2: Search variants (first word, without suffix, OCR corrections)
    const variants = generateSearchVariants(candidate);
    for (const variant of variants) {
      if (variant === candidate) continue; // already searched
      const variantResults = await searchWithQuery(variant);
      for (const card of variantResults) {
        const score = fuzzyMatchScore(candidate, card.name);
        const existing = allResults.get(card.id);
        if (!existing || existing.confidence < score) {
          allResults.set(card.id, { card, confidence: score, matchMethod: 'variant' });
        }
      }

      // Stop if we have enough
      const count = Array.from(allResults.values()).filter((r) => r.confidence > 0.6).length;
      if (count >= 5) break;
    }
  }

  // Step 5: Rank results
  onProgress('ranking');
  const scored: ScoredCard[] = Array.from(allResults.values())
    .map(({ card, confidence, matchMethod }) => ({ card, confidence, matchMethod }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  // Determine best query for display
  if (scored.length > 0) {
    bestQuery = candidates[0];
  }

  onProgress('done');
  return { cards: scored, ocrCandidates: candidates, bestQuery };
}

/**
 * Re-search with a manually corrected query (skips OCR).
 */
export async function searchWithText(
  query: string,
  onProgress: (step: ScanStep) => void,
): Promise<ScanResult> {
  onProgress('searching');
  const candidates = [query.trim()];
  const allResults = new Map<string, { card: PokemonCard; confidence: number; matchMethod: ScoredCard['matchMethod'] }>();

  const variants = generateSearchVariants(query);
  for (const variant of variants) {
    const results = await searchWithQuery(variant);
    for (const card of results) {
      const score = fuzzyMatchScore(query, card.name);
      const existing = allResults.get(card.id);
      if (!existing || existing.confidence < score) {
        allResults.set(card.id, { card, confidence: score, matchMethod: variant === query ? 'exact' : 'variant' });
      }
    }
  }

  onProgress('ranking');
  const scored: ScoredCard[] = Array.from(allResults.values())
    .map(({ card, confidence, matchMethod }) => ({ card, confidence, matchMethod }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  onProgress('done');
  return { cards: scored, ocrCandidates: candidates, bestQuery: query };
}
