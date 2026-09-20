import type { ParsedTransaction } from './statement.types';

export interface ParseResult {
  parserName: string;
  sourceType: string;
  transactions: ParsedTransaction[];
  metadata?: {
    accountNumber?: string;
    statementPeriod?: string;
    statementDate?: string;
    openingBalance?: number;
    closingBalance?: number;
  };
}

export interface StatementParser {
  name: string;
  sourceType: string;
  description: string;
  canParse(text: string, fileName?: string): boolean;
  parse(text: string, pagesText: string[]): ParseResult;
}

export interface ParserDetectionResult {
  parser: StatementParser;
  confidence: number;
  detectedType: string;
}
