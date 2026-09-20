import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs, 
  query, 
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../../config/firebase';
import type { Transaction } from '../../../types/expense.types';
import type { ParsedTransaction, StatementImportRecord } from '../types/statement.types';

const LOCAL_TX_KEY_PREFIX = 'expenseiq_tx_';
const LOCAL_HIST_KEY_PREFIX = 'expenseiq_hist_';

/**
 * Saves selected transactions and records statement import history.
 * Supports both Firestore and LocalStorage fallback.
 */
export const saveImportedTransactions = async (
  userId: string,
  fileName: string,
  sourceType: string,
  totalFound: number,
  duplicateCount: number,
  selectedTransactions: ParsedTransaction[]
): Promise<{ importedCount: number; historyRecord: StatementImportRecord }> => {
  const now = new Date().toISOString();
  const importedCount = selectedTransactions.length;

  const historyRecord: StatementImportRecord = {
    id: `hist_${Date.now()}`,
    userId,
    fileName,
    sourceType,
    importedAt: now,
    totalTransactionsFound: totalFound,
    duplicateCount,
    importedCount,
    status: importedCount > 0 ? 'Completed' : 'Partial',
  };

  const newTransactions: Transaction[] = selectedTransactions.map((pt, idx) => ({
    id: `tx_${Date.now()}_${idx}`,
    userId,
    date: pt.date,
    description: pt.description,
    amount: pt.amount,
    type: pt.type,
    category: pt.category,
    subCategory: pt.subCategory,
    merchant: pt.merchant,
    referenceId: pt.referenceId,
    paymentMethod: pt.paymentMethod,
    sourceStatement: pt.sourceStatement || sourceType,
    createdAt: now,
  }));

  // If Firebase Firestore is active
  if (isFirebaseConfigured && db) {
    try {
      const batch = writeBatch(db);
      const txColRef = collection(db, 'users', userId, 'transactions');

      for (const tx of newTransactions) {
        const docRef = doc(txColRef, tx.id);
        batch.set(docRef, tx);
      }

      await batch.commit();

      // Save history record (NO PDF saved!)
      const histColRef = collection(db, 'users', userId, 'importHistory');
      await addDoc(histColRef, historyRecord);

      return { importedCount, historyRecord };
    } catch (err) {
      console.error('Firestore save failed, fallback to local storage:', err);
      // Fallback
    }
  }

  // LocalStorage Fallback (Demo / Offline mode)
  const userTxKey = `${LOCAL_TX_KEY_PREFIX}${userId}`;
  const existingRaw = localStorage.getItem(userTxKey);
  const existingList: Transaction[] = existingRaw ? JSON.parse(existingRaw) : [];

  const updatedList = [...newTransactions, ...existingList];
  localStorage.setItem(userTxKey, JSON.stringify(updatedList));

  // Save history
  const userHistKey = `${LOCAL_HIST_KEY_PREFIX}${userId}`;
  const histRaw = localStorage.getItem(userHistKey);
  const histList: StatementImportRecord[] = histRaw ? JSON.parse(histRaw) : [];
  histList.unshift(historyRecord);
  localStorage.setItem(userHistKey, JSON.stringify(histList));

  return { importedCount, historyRecord };
};

/**
 * Loads all transactions for the current user.
 */
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  if (isFirebaseConfigured && db) {
    try {
      const txColRef = collection(db, 'users', userId, 'transactions');
      const q = query(txColRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Transaction);
    } catch (err) {
      console.warn('Firestore fetch failed, checking local storage:', err);
    }
  }

  const userTxKey = `${LOCAL_TX_KEY_PREFIX}${userId}`;
  const existingRaw = localStorage.getItem(userTxKey);
  return existingRaw ? JSON.parse(existingRaw) : [];
};

/**
 * Loads statement import history for the user.
 */
export const getStatementImportHistory = async (userId: string): Promise<StatementImportRecord[]> => {
  if (isFirebaseConfigured && db) {
    try {
      const histColRef = collection(db, 'users', userId, 'importHistory');
      const q = query(histColRef, orderBy('importedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as StatementImportRecord);
    } catch (err) {
      console.warn('Firestore history fetch failed, using local storage:', err);
    }
  }

  const userHistKey = `${LOCAL_HIST_KEY_PREFIX}${userId}`;
  const histRaw = localStorage.getItem(userHistKey);
  return histRaw ? JSON.parse(histRaw) : [];
};
