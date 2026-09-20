import type { StatementParser, ParseResult } from '../types/parser.types';
import type { ParsedTransaction } from '../types/statement.types';
import { normalizeToIsoDate } from '../utils/formatters';
import { mapToCategory } from '../utils/categoryMapper';
import { sanitizeDescription } from '../utils/sanitizer';

export class BankStatementParser implements StatementParser {
  name = 'Bank Account Statement Parser';
  sourceType = 'Bank Account';
  description = 'Parses tabular statements from Indian & international banks (HDFC, ICICI, SBI, Axis, Kotak, etc.)';

  canParse(text: string, fileName?: string): boolean {
    const lower = text.toLowerCase();
    const fName = (fileName || '').toLowerCase();

    return (
      lower.includes('account statement') ||
      lower.includes('statement of account') ||
      lower.includes('hdfc bank') ||
      lower.includes('icici bank') ||
      lower.includes('state bank of india') ||
      lower.includes('sbi') ||
      lower.includes('axis bank') ||
      lower.includes('kotak') ||
      lower.includes('bank of baroda') ||
      lower.includes('punjab national') ||
      fName.includes('bank') ||
      (lower.includes('withdrawal') && lower.includes('deposit')) ||
      (lower.includes('debit') && lower.includes('credit') && lower.includes('balance'))
    );
  }

  parse(text: string, _pagesText: string[]): ParseResult {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Matches date anywhere near the start: "18/09/2026", "18-Sep-2026", "18 Sep 2026", "18-09-2026"
    const dateRegex = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4})\b/i;
    // Amounts: 1,234.50 or 420.00
    const amountRegex = /\b(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})|\d+\.\d{2})\b/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const dateMatch = line.match(dateRegex);
      if (!dateMatch) continue;

      const rawDate = dateMatch[1];
      const isoDate = normalizeToIsoDate(rawDate);

      // Find amounts in line
      const amounts = Array.from(line.matchAll(amountRegex)).map(m => m[1]);
      if (amounts.length === 0) continue;

      // Filter parsed positive amounts
      const parsedAmounts = amounts
        .map(a => parseFloat(a.replace(/,/g, '')))
        .filter(n => !isNaN(n) && n > 0);

      if (parsedAmounts.length === 0) continue;

      // Identify transaction amount and closing balance
      let amount = 0;
      let type: 'debit' | 'credit' = 'debit';

      const isDr = /\b(dr|debit|withdrawal|paid)\b/i.test(line);
      const isCr = /\b(cr|credit|deposit|received|refund)\b/i.test(line);

      if (parsedAmounts.length >= 2) {
        // Last number is typically closing balance, second to last is transaction amount
        amount = parsedAmounts[parsedAmounts.length - 2];
        type = isCr ? 'credit' : isDr ? 'debit' : 'debit';
      } else {
        amount = parsedAmounts[0];
        type = isCr ? 'credit' : 'debit';
      }

      if (amount <= 0) continue;

      // Extract narration / description by stripping dates and amounts
      let narration = line
        .replace(dateMatch[0], '')
        .replace(/[\r\n]+/g, ' ');

      for (const amtStr of amounts) {
        narration = narration.replace(amtStr, '');
      }

      narration = sanitizeDescription(
        narration
          .replace(/\b(dr|cr|debit|credit|inr|rs\.?)\b/gi, '')
          .replace(/^[-|/:\s]+|[-|/:\s]+$/g, '')
      );

      if (narration.length < 2) {
        narration = 'Bank Transaction';
      }

      // Check for reference / UTR / Cheque number
      let referenceId: string | undefined;
      const refMatch = line.match(/(?:UPI\/|NEFT\/|IMPS\/|RTGS\/|CHQ NO\.?\s*|REF[:\s]*)(\d+)/i) ||
                        line.match(/\b(\d{10,16})\b/);
      if (refMatch) {
        referenceId = refMatch[1];
      }

      const mapping = mapToCategory(narration);
      if (mapping.category === 'Income & Investment' && mapping.subCategory === 'Salary') {
        type = 'credit';
      }

      transactions.push({
        id: `bank_${Date.now()}_${transactions.length}`,
        date: isoDate,
        rawDate,
        description: narration,
        amount,
        type,
        category: mapping.category,
        subCategory: mapping.subCategory,
        merchant: mapping.merchant,
        referenceId,
        paymentMethod: referenceId ? 'NetBanking / UPI' : 'Bank Transfer',
        sourceStatement: 'Bank Account',
        confidence: mapping.confidence,
        isSelected: true,
      });
    }

    return {
      parserName: this.name,
      sourceType: this.sourceType,
      transactions,
    };
  }
}
