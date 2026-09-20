import type { StatementParser, ParseResult } from '../types/parser.types';
import type { ParsedTransaction } from '../types/statement.types';
import { normalizeToIsoDate } from '../utils/formatters';
import { mapToCategory } from '../utils/categoryMapper';
import { sanitizeDescription } from '../utils/sanitizer';

export class PhonePeParser implements StatementParser {
  name = 'PhonePe Statement Parser';
  sourceType = 'PhonePe';
  description = 'Parses official PhonePe UPI & Wallet account statements';

  canParse(text: string, fileName?: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerFile = (fileName || '').toLowerCase();

    return (
      lowerText.includes('phonepe') ||
      lowerFile.includes('phonepe') ||
      lowerText.includes('transaction statement for') ||
      (lowerText.includes('transaction id') && (lowerText.includes('utr') || lowerText.includes('paid to')))
    );
  }

  parse(text: string, _pagesText: string[]): ParseResult {
    const transactions: ParsedTransaction[] = [];
    const allLines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Standard date patterns found in PhonePe statements:
    // "Aug 01, 2026" or "18 Sep 2026" or "18/09/2026"
    const dateStartRegex = /^([A-Za-z]{3}\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/i;

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];

      // Skip statement headers, date range filters, and footers
      if (line.includes('Transaction Statement for')) continue;
      if (line.includes(' - ') && /^[A-Za-z]{3}\s+\d{1,2}/.test(line)) continue;
      if (line.includes('This is a system generated statement')) continue;
      if (/^Date\s+Transaction Details\s+Type\s+Amount/i.test(line)) continue;
      if (/^Page\s+\d+\s+of\s+\d+/i.test(line)) continue;

      const dateMatch = line.match(dateStartRegex);
      if (dateMatch) {
        const rawDate = dateMatch[1];
        const isoDate = normalizeToIsoDate(rawDate);

        // Gather the full transaction block (current line + subsequent detail lines)
        const blockLines = [line];
        for (let j = i + 1; j < Math.min(allLines.length, i + 6); j++) {
          const nextLine = allLines[j];
          // Stop if next line is a new transaction date
          if (dateStartRegex.test(nextLine) && !nextLine.includes(' - ')) break;
          // Stop on page footer
          if (/^Page\s+\d+\s+of\s+\d+/i.test(nextLine)) break;
          if (nextLine.includes('--- PAGE BREAK ---')) break;
          blockLines.push(nextLine);
        }

        const blockText = blockLines.join(' ');

        // 1. Extract Description & Merchant
        let description = 'PhonePe Payment';
        let merchant = 'Merchant';

        const paidMatch = blockText.match(/(?:Paid to|Payment to|Transfer to)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:Debit|Credit|INR|Transaction ID|UTR|Debited|Credited)|$)/i);
        const recMatch = blockText.match(/(?:Received from)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:Debit|Credit|INR|Transaction ID|UTR|Debited|Credited)|$)/i);

        if (paidMatch && paidMatch[1]) {
          merchant = paidMatch[1].trim();
          description = `Paid to ${merchant}`;
        } else if (recMatch && recMatch[1]) {
          merchant = recMatch[1].trim();
          description = `Received from ${merchant}`;
        } else {
          // Fallback extraction
          const clean = line.replace(dateStartRegex, '').replace(/\b(Debit|Credit|INR)\b/gi, '').trim();
          if (clean.length > 2) {
            description = clean;
            merchant = clean;
          }
        }

        // 2. Extract Type (Debit vs Credit)
        let type: 'debit' | 'credit' = 'debit';
        if (/\bCredit\b/i.test(line) || /\bReceived from\b/i.test(blockText) || /\bCredited to\b/i.test(blockText)) {
          type = 'credit';
        } else if (/\bDebit\b/i.test(line) || /\bPaid to\b/i.test(blockText) || /\bDebited from\b/i.test(blockText)) {
          type = 'debit';
        }

        // 3. Extract Amount
        let amount = 0;
        const inrMatch = blockText.match(/INR\s*([0-9,]+\.[0-9]{2})/i) ||
                         blockText.match(/(?:₹|Rs\.?)\s*([0-9,]+\.[0-9]{2})/i) ||
                         blockText.match(/\b([0-9,]+\.[0-9]{2})\b/);

        if (inrMatch) {
          const parsed = parseFloat(inrMatch[1].replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) {
            amount = parsed;
          }
        }

        // 4. Extract Reference ID & UTR
        let referenceId: string | undefined;
        const txnIdMatch = blockText.match(/Transaction ID\s*:\s*([A-Za-z0-9]+)/i);
        const utrMatch = blockText.match(/UTR No\s*:\s*([A-Za-z0-9]+)/i);

        if (txnIdMatch && txnIdMatch[1]) {
          referenceId = txnIdMatch[1].trim();
        } else if (utrMatch && utrMatch[1]) {
          referenceId = utrMatch[1].trim();
        }

        // 5. Payment method / account
        const accMatch = blockText.match(/(?:Debited from|Credited to)\s+([A-Za-z0-9]+)/i);
        const paymentMethod = accMatch ? `Bank Account ${accMatch[1]}` : 'PhonePe / UPI';

        // 6. Smart categorization
        const mapping = mapToCategory(description, merchant);

        if (amount > 0 && description) {
          // Avoid duplicate insertion from page boundary overlaps
          const alreadyExists = transactions.some(
            t => t.date === isoDate && t.amount === amount && (t.referenceId === referenceId || t.description === description)
          );

          if (!alreadyExists) {
            transactions.push({
              id: `phonepe_${Date.now()}_${transactions.length}`,
              date: isoDate,
              rawDate,
              description: sanitizeDescription(description),
              amount,
              type,
              category: mapping.category,
              subCategory: mapping.subCategory,
              merchant: mapping.merchant || merchant,
              referenceId,
              paymentMethod,
              sourceStatement: 'PhonePe',
              confidence: mapping.confidence,
              isSelected: true,
            });
          }
        }
      }
    }

    return {
      parserName: this.name,
      sourceType: this.sourceType,
      transactions,
    };
  }
}
