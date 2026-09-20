import type { StatementParser } from '../types/parser.types';
import { PhonePeParser } from './phonePeParser';
import { GooglePayParser } from './googlePayParser';
import { BankStatementParser } from './bankStatementParser';
import { GenericStatementParser } from './genericStatementParser';

export class StatementParserRegistry {
  private static parsers: StatementParser[] = [
    new PhonePeParser(),
    new GooglePayParser(),
    new BankStatementParser(),
    new GenericStatementParser(),
  ];

  public static getAvailableParsers(): StatementParser[] {
    return this.parsers;
  }

  public static detectParser(text: string, fileName?: string): StatementParser {
    // Check specific parsers first (excluding the generic fallback)
    for (const parser of this.parsers) {
      if (parser instanceof GenericStatementParser) continue;
      if (parser.canParse(text, fileName)) {
        return parser;
      }
    }

    // Default to generic parser
    return this.parsers[this.parsers.length - 1];
  }

  public static getParserByName(name: string): StatementParser | undefined {
    return this.parsers.find(p => p.name === name || p.sourceType.toLowerCase() === name.toLowerCase());
  }
}
