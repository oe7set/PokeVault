/**
 * OCR text cleaning, search variant generation, and fuzzy matching utilities.
 */

const OCR_ARTIFACTS = /[|[\]{}()_~`#*]/g;
const HP_PATTERN = /\d{2,4}\s*HP/gi;
const STAGE_PREFIX = /^(stage\s*\d\s*[-–—]?\s*|basic\s*[-–—]?\s*)/i;
const TRAILING_DIGITS = /^\d+\s+|\s+\d+$/g;

// Common OCR misreads: char → likely correct char
const OCR_CORRECTIONS: [RegExp, string][] = [
  [/0/g, 'O'],
  [/1/g, 'l'],
  [/5/g, 'S'],
  [/8/g, 'B'],
  [/\$/g, 'S'],
  [/@/g, 'a'],
];

const POKEMON_SUFFIXES = /\s+(ex|EX|gx|GX|V|VSTAR|VMAX|v|vstar|vmax)\s*$/;

export function cleanOCRText(raw: string): string[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .map((l) =>
      l
        .replace(OCR_ARTIFACTS, '')
        .replace(HP_PATTERN, '')
        .replace(STAGE_PREFIX, '')
        .replace(TRAILING_DIGITS, '')
        .trim(),
    )
    .filter((l) => l.length > 1 && /[a-zA-Z]{2,}/.test(l));

  // Score lines by likelihood of being a card name
  const scored = lines.map((line) => {
    const alphaRatio = (line.match(/[a-zA-Z]/g)?.length ?? 0) / line.length;
    // Prefer lines that are 3-30 chars, mostly alphabetic
    const lengthScore = line.length >= 3 && line.length <= 30 ? 1 : 0.5;
    return { line, score: alphaRatio * lengthScore };
  });

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate similar lines
  const seen = new Set<string>();
  const results: string[] = [];
  for (const { line } of scored) {
    const normalized = line.toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      results.push(line);
      if (results.length >= 3) break;
    }
  }

  return results;
}

export function generateSearchVariants(name: string): string[] {
  const variants = new Set<string>();
  const trimmed = name.trim();
  if (!trimmed) return [];

  variants.add(trimmed);

  // First word only
  const firstWord = trimmed.split(/\s+/)[0];
  if (firstWord.length >= 3) {
    variants.add(firstWord);
  }

  // Without Pokemon suffix
  const withoutSuffix = trimmed.replace(POKEMON_SUFFIXES, '').trim();
  if (withoutSuffix !== trimmed && withoutSuffix.length >= 3) {
    variants.add(withoutSuffix);
  }

  // With common suffix variants
  if (!POKEMON_SUFFIXES.test(trimmed) && firstWord.length >= 3) {
    variants.add(`${firstWord} ex`);
    variants.add(`${firstWord} V`);
  }

  // Apply OCR corrections to the original name
  let corrected = trimmed;
  for (const [pattern, replacement] of OCR_CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }
  if (corrected !== trimmed) {
    variants.add(corrected);
    const correctedFirst = corrected.split(/\s+/)[0];
    if (correctedFirst.length >= 3) {
      variants.add(correctedFirst);
    }
  }

  return Array.from(variants);
}

export function levenshteinDistance(a: string, b: string): number {
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Single-row optimization
  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb];
}

export function fuzzyMatchScore(ocrText: string, cardName: string): number {
  const ocr = ocrText.toLowerCase().trim();
  const name = cardName.toLowerCase().trim();

  if (!ocr || !name) return 0;

  // Exact match
  if (ocr === name) return 1.0;

  // Substring match
  if (name.includes(ocr) || ocr.includes(name)) return 0.95;

  // First word match
  const ocrFirst = ocr.split(/\s+/)[0];
  const nameFirst = name.split(/\s+/)[0];
  if (ocrFirst === nameFirst && ocrFirst.length >= 3) return 0.85;

  // Levenshtein similarity
  const dist = levenshteinDistance(ocr, name);
  const maxLen = Math.max(ocr.length, name.length);
  const similarity = 1 - dist / maxLen;

  // First-word Levenshtein bonus
  const firstWordDist = levenshteinDistance(ocrFirst, nameFirst);
  const firstWordMaxLen = Math.max(ocrFirst.length, nameFirst.length);
  const firstWordSim = 1 - firstWordDist / firstWordMaxLen;

  // Weighted combination
  return Math.max(similarity, firstWordSim * 0.9);
}
