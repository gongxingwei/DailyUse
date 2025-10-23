/**
 * Fuzzy Search Engine
 * 
 * Implements fuzzy string matching using:
 * - Levenshtein distance algorithm
 * - Token-based matching
 * - Acronym detection
 * 
 * @module fuzzySearch
 */

/**
 * Match result with score and positions
 */
export interface FuzzyMatchResult {
  score: number; // 0-100, higher is better
  matches: TextMatch[]; // Positions of matched text
}

/**
 * Text match position
 */
export interface TextMatch {
  start: number;
  end: number;
  length: number;
}

/**
 * Fuzzy match options
 */
export interface FuzzyMatchOptions {
  threshold?: number; // Minimum score to consider a match (default: 60)
  caseSensitive?: boolean; // Case sensitive matching (default: false)
  tokenize?: boolean; // Enable token-based matching (default: true)
  acronym?: boolean; // Enable acronym matching (default: true)
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * Time complexity: O(m * n) where m, n are string lengths
 * Space complexity: O(m * n)
 * 
 * @param a First string
 * @param b Second string
 * @returns Edit distance
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        // Characters match, no operation needed
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        // Characters differ, take minimum of:
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score from Levenshtein distance
 * 
 * Score = (1 - distance / maxLength) * 100
 * 
 * @param distance Levenshtein distance
 * @param maxLength Maximum string length
 * @returns Similarity score (0-100)
 */
function distanceToScore(distance: number, maxLength: number): number {
  if (maxLength === 0) return 100;
  return Math.max(0, (1 - distance / maxLength) * 100);
}

/**
 * Find all occurrences of substring in text (case insensitive)
 * 
 * @param text Text to search in
 * @param substring Substring to find
 * @returns Array of match positions
 */
function findSubstringMatches(text: string, substring: string): TextMatch[] {
  const matches: TextMatch[] = [];
  const lowerText = text.toLowerCase();
  const lowerSubstring = substring.toLowerCase();

  let index = 0;
  while ((index = lowerText.indexOf(lowerSubstring, index)) !== -1) {
    matches.push({
      start: index,
      end: index + substring.length,
      length: substring.length,
    });
    index += substring.length;
  }

  return matches;
}

/**
 * Perform fuzzy matching between query and target string
 * 
 * Algorithm:
 * 1. Exact substring match → 100 score
 * 2. Token-based matching → weighted score
 * 3. Acronym matching → 90 score
 * 4. Levenshtein distance → similarity score
 * 
 * @param query Search query
 * @param target Target string to match against
 * @param options Matching options
 * @returns Match result with score and positions
 */
export function fuzzyMatch(
  query: string,
  target: string,
  options: FuzzyMatchOptions = {}
): FuzzyMatchResult {
  const {
    threshold = 60,
    caseSensitive = false,
    tokenize = true,
    acronym = true,
  } = options;

  // Normalize strings
  const q = caseSensitive ? query.trim() : query.toLowerCase().trim();
  const t = caseSensitive ? target.trim() : target.toLowerCase().trim();

  // Edge cases
  if (q.length === 0) {
    return { score: 0, matches: [] };
  }

  if (q === t) {
    return {
      score: 100,
      matches: [{ start: 0, end: t.length, length: t.length }],
    };
  }

  // Step 1: Exact substring match
  if (t.includes(q)) {
    const matches = findSubstringMatches(target, query);
    return {
      score: 100,
      matches,
    };
  }

  // Step 2: Token-based matching
  if (tokenize) {
    const queryTokens = q.split(/\s+/).filter((t) => t.length > 0);
    const targetTokens = t.split(/\s+/).filter((t) => t.length > 0);

    let bestScore = 0;
    const allMatches: TextMatch[] = [];

    for (const qToken of queryTokens) {
      let tokenBestScore = 0;

      for (const tToken of targetTokens) {
        // Check exact token match
        if (tToken.includes(qToken)) {
          tokenBestScore = 100;
          // Find position in original target
          const matches = findSubstringMatches(target, qToken);
          allMatches.push(...matches);
          break;
        }

        // Calculate Levenshtein similarity
        const distance = levenshteinDistance(qToken, tToken);
        const maxLen = Math.max(qToken.length, tToken.length);
        const score = distanceToScore(distance, maxLen);
        tokenBestScore = Math.max(tokenBestScore, score);
      }

      // Weight: average of all token scores
      bestScore += tokenBestScore;
    }

    bestScore = queryTokens.length > 0 ? bestScore / queryTokens.length : 0;

    if (bestScore >= threshold) {
      return {
        score: Math.round(bestScore),
        matches: allMatches,
      };
    }
  }

  // Step 3: Acronym matching
  if (acronym) {
    const targetTokens = t.split(/\s+/).filter((t) => t.length > 0);
    const targetAcronym = targetTokens.map((t) => t[0]).join('');

    if (targetAcronym === q) {
      return {
        score: 90,
        matches: targetTokens.map((_, i) => ({
          start: target.toLowerCase().indexOf(targetTokens[i]),
          end: target.toLowerCase().indexOf(targetTokens[i]) + 1,
          length: 1,
        })),
      };
    }
  }

  // Step 4: Overall Levenshtein distance
  const distance = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  const score = distanceToScore(distance, maxLen);

  return {
    score: Math.round(score),
    matches: score >= threshold ? [{ start: 0, end: t.length, length: t.length }] : [],
  };
}

/**
 * Search multiple fields with weighted scoring
 * 
 * @param query Search query
 * @param fields Object with field name → field value
 * @param weights Object with field name → weight (default: 1.0)
 * @returns Combined match result
 */
export function fuzzyMatchMultiField(
  query: string,
  fields: Record<string, string>,
  weights: Record<string, number> = {}
): FuzzyMatchResult {
  let totalScore = 0;
  let totalWeight = 0;
  const allMatches: TextMatch[] = [];

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    const weight = weights[fieldName] || 1.0;
    const result = fuzzyMatch(query, fieldValue);

    totalScore += result.score * weight;
    totalWeight += weight;
    allMatches.push(...result.matches);
  }

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  return {
    score: Math.round(finalScore),
    matches: allMatches,
  };
}

/**
 * Filter and sort array of items by fuzzy match score
 * 
 * @param query Search query
 * @param items Array of items to search
 * @param getSearchText Function to extract searchable text from item
 * @param options Matching options
 * @returns Sorted array of items with scores
 */
export function fuzzyFilter<T>(
  query: string,
  items: T[],
  getSearchText: (item: T) => string,
  options: FuzzyMatchOptions = {}
): Array<T & { _score: number; _matches: TextMatch[] }> {
  const threshold = options.threshold || 60;

  return items
    .map((item) => {
      const text = getSearchText(item);
      const result = fuzzyMatch(query, text, options);
      return {
        ...item,
        _score: result.score,
        _matches: result.matches,
      };
    })
    .filter((item) => item._score >= threshold)
    .sort((a, b) => b._score - a._score);
}

/**
 * Highlight matched text with markers
 * 
 * @param text Original text
 * @param matches Match positions
 * @param before Opening marker (e.g., '<mark>')
 * @param after Closing marker (e.g., '</mark>')
 * @returns Text with highlighted matches
 */
export function highlightMatches(
  text: string,
  matches: TextMatch[],
  before = '<mark>',
  after = '</mark>'
): string {
  if (matches.length === 0) return text;

  // Sort matches by position
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

  // Merge overlapping matches
  const merged: TextMatch[] = [];
  let current = sortedMatches[0];

  for (let i = 1; i < sortedMatches.length; i++) {
    const next = sortedMatches[i];
    if (next.start <= current.end) {
      // Overlapping, merge
      current = {
        start: current.start,
        end: Math.max(current.end, next.end),
        length: Math.max(current.end, next.end) - current.start,
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  // Build highlighted string
  let result = '';
  let lastIndex = 0;

  for (const match of merged) {
    result += text.substring(lastIndex, match.start);
    result += before;
    result += text.substring(match.start, match.end);
    result += after;
    lastIndex = match.end;
  }

  result += text.substring(lastIndex);

  return result;
}
