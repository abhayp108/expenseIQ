import type { Transaction } from '../../../types/expense.types';
import type { ParsedTransaction } from '../types/statement.types';

export interface DuplicateDetectionResult {
  totalCount: number;
  duplicateCount: number;
  newCount: number;
  transactions: ParsedTransaction[];
}

/**
 * Calculates Jaccard token similarity between two description strings (0 to 1).
 */
const stringSimilarity = (str1: string, str2: string): number => {
  const words1 = new Set(str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const words2 = new Set(str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Checks if two dates are within +/- 1 day (to account for payment vs settlement dates).
 */
const isDateWithinDays = (date1: string, date2: string, daysTolerance: number = 1): boolean => {
  try {
    const t1 = new Date(date1).getTime();
    const t2 = new Date(date2).getTime();
    const diffDays = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24);
    return diffDays <= daysTolerance;
  } catch {
    return date1 === date2;
  }
};

/**
 * Detects duplicate transactions using reference ID, amount, date, and description.
 */
export const detectDuplicates = (
  parsedList: ParsedTransaction[],
  existingTransactions: Transaction[]
): DuplicateDetectionResult => {
  let duplicateCount = 0;

  const enrichedList = parsedList.map(parsed => {
    // 1. Reference ID Match
    if (parsed.referenceId) {
      const match = existingTransactions.find(
        e => e.referenceId && e.referenceId.trim() === parsed.referenceId?.trim()
      );
      if (match) {
        duplicateCount++;
        return {
          ...parsed,
          isDuplicate: true,
          duplicateReason: `Exact reference ID match: ${parsed.referenceId}`,
          duplicateOfId: match.id,
          isSelected: false, // unselect duplicate by default
        };
      }
    }

    // 2. Exact Date + Exact Amount + Similar Description
    const matchSameDateAmt = existingTransactions.find(e => {
      const sameAmount = Math.abs(e.amount - parsed.amount) < 0.01;
      const sameDate = e.date === parsed.date;
      const sameType = e.type === parsed.type;
      return sameAmount && sameDate && sameType;
    });

    if (matchSameDateAmt) {
      duplicateCount++;
      return {
        ...parsed,
        isDuplicate: true,
        duplicateReason: `Matches existing transaction on ${matchSameDateAmt.date} for ₹${matchSameDateAmt.amount}`,
        duplicateOfId: matchSameDateAmt.id,
        isSelected: false,
      };
    }

    // 3. Close Date (+/- 1 day) + Exact Amount + High Description Similarity
    const fuzzyMatch = existingTransactions.find(e => {
      const sameAmount = Math.abs(e.amount - parsed.amount) < 0.01;
      const closeDate = isDateWithinDays(e.date, parsed.date, 1);
      const similarity = stringSimilarity(e.description, parsed.description);
      return sameAmount && closeDate && similarity > 0.4;
    });

    if (fuzzyMatch) {
      duplicateCount++;
      return {
        ...parsed,
        isDuplicate: true,
        duplicateReason: `Likely duplicate of "${fuzzyMatch.description}" (${fuzzyMatch.date})`,
        duplicateOfId: fuzzyMatch.id,
        isSelected: false,
      };
    }

    // No duplicate found
    return {
      ...parsed,
      isDuplicate: false,
      isSelected: true, // select new by default
    };
  });

  return {
    totalCount: enrichedList.length,
    duplicateCount,
    newCount: enrichedList.length - duplicateCount,
    transactions: enrichedList,
  };
};
