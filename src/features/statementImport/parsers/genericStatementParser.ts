import type { StatementParser, ParseResult } from '../types/parser.types';
import type { ParsedTransaction } from '../types/statement.types';
import { normalizeToIsoDate } from '../utils/formatters';
import { mapToCategory } from '../utils/categoryMapper';
import { sanitizeDescription } from '../utils/sanitizer';

export class GenericStatementParser implements StatementParser {
  name = 'Generic Statement Parser';
  sourceType = 'Financial Statement';
  description = 'Heuristic fallback parser for general financial & credit card PDF statements';

  canParse(_text: string, _fileName?: string): boolean {
    return true; // Always can attempt parse as fallback
  }

  parse(text: string, _pagesText: string[]): ParseResult {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    const dateRegex = /(?:(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})|(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})|([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}))/;
    const amountRegex = /(?:₹|\$|€|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2}))/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 5) continue;

      const dateMatch = line.match(dateRegex);
      const amountMatch = line.match(amountRegex);

      if (dateMatch && amountMatch) {
        const rawDate = dateMatch[0];
        const isoDate = normalizeToIsoDate(rawDate);

        const num = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (isNaN(num) || num <= 0) continue;

        // Clean out date and amount to get description
        let desc = line
          .replace(dateMatch[0], '')
          .replace(amountMatch[0], '')
          .trim();

        // Strip leading / trailing symbols
        desc = desc.replace(/^[-|/:]+|[-|/:]+$/g, '').trim();

        if (desc.length < 2) {
          desc = 'General Transaction';
        }

        let type: 'debit' | 'credit' = 'debit';
        if (/\b(cr|credit|refund|cashback|deposit|received)\b/i.test(line)) {
          type = 'credit';
        }

        const mapping = mapToCategory(desc);

        // Check if reference exists in line
        const refMatch = line.match(/\b([A-Z0-9]{8,18})\b/);
        const referenceId = refMatch ? refMatch[1] : undefined;

        transactions.push({
          id: `generic_${Date.now()}_${transactions.length}`,
          date: isoDate,
          rawDate,
          description: sanitizeDescription(desc),
          amount: num,
          type,
          category: mapping.category,
          subCategory: mapping.subCategory,
          merchant: mapping.merchant,
          referenceId,
          paymentMethod: 'PDF Import',
          sourceStatement: 'PDF Statement',
          confidence: mapping.confidence * 0.8,
          isSelected: true,
        });
      }
    }

    return {
      parserName: this.name,
      sourceType: this.sourceType,
      transactions,
    };
  }
}
