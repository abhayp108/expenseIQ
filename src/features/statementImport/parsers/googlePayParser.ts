import type { StatementParser, ParseResult } from '../types/parser.types';
import type { ParsedTransaction } from '../types/statement.types';
import { normalizeToIsoDate } from '../utils/formatters';
import { mapToCategory } from '../utils/categoryMapper';
import { sanitizeDescription } from '../utils/sanitizer';

export class GooglePayParser implements StatementParser {
  name = 'Google Pay Statement Parser';
  sourceType = 'Google Pay';
  description = 'Parses Google Pay transaction exports and statement PDFs';

  canParse(text: string, fileName?: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerFile = (fileName || '').toLowerCase();

    return (
      lowerText.includes('google pay') ||
      lowerFile.includes('gpay') ||
      lowerFile.includes('google_pay') ||
      lowerFile.includes('googlepay') ||
      (lowerText.includes('upi transaction id') && lowerText.includes('google'))
    );
  }

  parse(text: string, _pagesText: string[]): ParseResult {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    const dateRegex = /(?:(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})|((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})|(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}))/i;
    const amountRegex = /(?:₹|Rs\.?|INR)?\s*([0-9,]+\.[0-9]{2}|[0-9,]{2,})/i;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      const hasDate = dateRegex.test(line);
      const isPaymentTo = /paid to|payment to|transferred to|received from/i.test(line);

      if (hasDate || isPaymentTo) {
        const windowLines = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 5)).map(l => l.trim());
        const combined = windowLines.join(' ');

        const foundDate = combined.match(dateRegex);
        if (!foundDate) {
          i++;
          continue;
        }

        const rawDate = foundDate[0];
        const isoDate = normalizeToIsoDate(rawDate);

        // Amount
        let amount = 0;
        const foundAmount = combined.match(amountRegex);
        if (foundAmount) {
          const num = parseFloat(foundAmount[1].replace(/,/g, ''));
          if (!isNaN(num) && num > 0) amount = num;
        }

        // Type
        let type: 'debit' | 'credit' = 'debit';
        if (/received from|credited|reward|cashback/i.test(combined)) {
          type = 'credit';
        } else if (/paid to|payment to|transferred to|debited/i.test(combined)) {
          type = 'debit';
        }

        // Description & Merchant
        let description = 'Google Pay Transaction';
        let merchant = 'Merchant';

        const paidMatch = combined.match(/(?:paid to|payment to|transferred to)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:₹|Rs|UPI|Ref|completed)|$)/i);
        const receivedMatch = combined.match(/received from\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:₹|Rs|UPI|Ref|completed)|$)/i);

        if (paidMatch && paidMatch[1]) {
          merchant = paidMatch[1].trim();
          description = `Payment to ${merchant}`;
        } else if (receivedMatch && receivedMatch[1]) {
          merchant = receivedMatch[1].trim();
          description = `Received from ${merchant}`;
        }

        // Reference / UPI ID
        let referenceId: string | undefined;
        const upiRefMatch = combined.match(/(?:UPI Ref(?:\s+No)?|Txn ID|Google Transaction ID)[:\s]+([A-Za-z0-9]+)/i);
        if (upiRefMatch && upiRefMatch[1]) {
          referenceId = upiRefMatch[1].trim();
        } else {
          const digits = combined.match(/\b\d{12}\b/);
          if (digits) referenceId = digits[0];
        }

        const mapping = mapToCategory(description, merchant);

        if (amount > 0) {
          const isDuplicateInList = transactions.some(
            t => t.date === isoDate && t.amount === amount && (t.referenceId === referenceId || t.description === description)
          );

          if (!isDuplicateInList) {
            transactions.push({
              id: `gpay_${Date.now()}_${transactions.length}`,
              date: isoDate,
              rawDate,
              description: sanitizeDescription(description),
              amount,
              type,
              category: mapping.category,
              subCategory: mapping.subCategory,
              merchant: mapping.merchant || merchant,
              referenceId,
              paymentMethod: 'Google Pay / UPI',
              sourceStatement: 'Google Pay',
              confidence: mapping.confidence,
              isSelected: true,
            });
          }
        }

        i += 2;
      } else {
        i++;
      }
    }

    return {
      parserName: this.name,
      sourceType: this.sourceType,
      transactions,
    };
  }
}
