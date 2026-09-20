import type { TransactionType } from '../../../types/expense.types';

export interface ParsedTransaction {
  id: string; // client temporary ID
  date: string; // YYYY-MM-DD
  rawDate?: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  subCategory?: string;
  merchant?: string;
  referenceId?: string;
  paymentMethod?: string;
  sourceStatement: string;
  confidence?: number;
  isDuplicate?: boolean;
  duplicateReason?: string;
  duplicateOfId?: string;
  isSelected: boolean;
  isIgnored?: boolean;
}

export interface StatementImportRecord {
  id: string;
  userId: string;
  fileName: string;
  sourceType: string;
  importedAt: string; // ISO string
  totalTransactionsFound: number;
  duplicateCount: number;
  importedCount: number;
  status: 'Completed' | 'Partial' | 'Failed';
}

export interface PDFExtractionResult {
  isPasswordProtected: boolean;
  needsPassword?: boolean;
  pagesText: string[];
  fullText: string;
  pageCount: number;
  fileName: string;
}
