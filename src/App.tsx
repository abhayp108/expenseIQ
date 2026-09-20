import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { Transaction } from './types/expense.types';
import type { StatementImportRecord } from './features/statementImport/types/statement.types';
import { 
  getUserTransactions, 
  getStatementImportHistory 
} from './features/statementImport/services/statementImportService';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { StatementImportModal } from './features/statementImport/components/StatementImportModal';
import { ImportHistoryView } from './features/statementImport/components/ImportHistoryView';

const MainApp: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'history'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<StatementImportRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modal visibility
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load transactions
  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    const userTx = await getUserTransactions(user.uid);
    // Automatically purge old mock seed transactions
    const cleanUserTx = userTx.filter(t => !t.id.startsWith('tx_seed_'));
    setTransactions(cleanUserTx);
    localStorage.setItem(`expenseiq_tx_${user.uid}`, JSON.stringify(cleanUserTx));

    setIsLoadingHistory(true);
    const hist = await getStatementImportHistory(user.uid);
    setHistory(hist);
    setIsLoadingHistory(false);
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Handle transaction deletion
  const handleDeleteTransaction = (id: string) => {
    if (!user) return;
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(`expenseiq_tx_${user.uid}`, JSON.stringify(updated));
  };

  // Handle clearing all transactions
  const handleClearAllTransactions = () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to clear all transactions? You can import fresh transactions anytime from your statement PDF.')) {
      setTransactions([]);
      localStorage.setItem(`expenseiq_tx_${user.uid}`, JSON.stringify([]));
    }
  };

  // Handle manual transaction addition
  const handleAddManualTransaction = (newTxData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...newTxData,
      id: `tx_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`expenseiq_tx_${user.uid}`, JSON.stringify(updated));
  };

  // Callback when import completes
  const handleImportComplete = (_count: number) => {
    loadUserData();
  };

  // Selected category filter for drilldown navigation
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'transactions') {
            // Keep existing filter or default
          }
          setActiveTab(tab);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            transactions={transactions}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onViewAllTransactions={(cat?: string) => {
              setSelectedCategoryFilter(cat || 'all');
              setActiveTab('transactions');
            }}
            onClearAll={handleClearAllTransactions}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            initialCategory={selectedCategoryFilter}
            onDeleteTransaction={handleDeleteTransaction}
            onClearAllTransactions={handleClearAllTransactions}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <ImportHistoryView
            history={history}
            isLoading={isLoadingHistory}
          />
        )}
      </main>

      {/* Statement Import Wizard Modal */}
      {isImportModalOpen && user && (
        <StatementImportModal
          userId={user.uid}
          existingTransactions={transactions}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={handleImportComplete}
        />
      )}

      {/* Manual Add Modal */}
      {isAddModalOpen && user && (
        <TransactionModal
          userId={user.uid}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddManualTransaction}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
