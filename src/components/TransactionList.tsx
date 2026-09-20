import React, { useState } from 'react';
import type { Transaction } from '../types/expense.types';
import { formatCurrency, formatDisplayDate } from '../features/statementImport/utils/formatters';
import { DEFAULT_CATEGORIES } from '../types/expense.types';
import { 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  UploadCloud, 
  Plus
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  initialCategory?: string;
  onDeleteTransaction: (id: string) => void;
  onClearAllTransactions?: () => void;
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  initialCategory,
  onDeleteTransaction,
  onClearAllTransactions,
  onOpenImportModal,
  onOpenAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || 'all');

  // Sync with initialCategory if passed or changed
  React.useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
    }
  }, [initialCategory]);

  const filtered = transactions.filter(t => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchSub = t.subCategory?.toLowerCase().includes(q);
      const matchMerch = t.merchant?.toLowerCase().includes(q);
      const matchRef = t.referenceId?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchSub && !matchMerch && !matchRef) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;

    // Category filter
    if (categoryFilter !== 'all') {
      const cat = t.category?.toLowerCase() || '';
      const sub = t.subCategory?.toLowerCase() || '';

      if (categoryFilter === 'Food' || categoryFilter === 'Food & Dining') {
        const isFood = (
          cat === 'food' ||
          cat === 'food & dining' ||
          cat === 'company canteen' ||
          cat === 'vegetables' ||
          cat === 'tea & snacks' ||
          sub.includes('canteen') ||
          sub.includes('vegetable') ||
          sub.includes('tea') ||
          sub.includes('nasta') ||
          sub.includes('chai') ||
          sub.includes('food delivery') ||
          sub.includes('restaurant') ||
          sub.includes('cafe')
        );
        if (!isFood) return false;
      } else if (categoryFilter === 'Company Canteen') {
        if (cat !== 'company canteen' && !sub.includes('canteen')) return false;
      } else if (categoryFilter === 'Vegetables') {
        if (cat !== 'vegetables' && !sub.includes('vegetable')) return false;
      } else if (categoryFilter === 'Tea & Snacks') {
        if (cat !== 'tea & snacks' && !sub.includes('tea') && !sub.includes('nasta') && !sub.includes('chai')) return false;
      } else if (categoryFilter === 'Dining & Delivery') {
        const isDining = cat === 'food & dining' && !sub.includes('canteen') && !sub.includes('vegetable') && !sub.includes('tea') && !sub.includes('nasta');
        if (!isDining && cat !== 'food') return false;
      } else {
        if (t.category !== categoryFilter) return false;
      }
    }

    return true;
  });

  return (
    <div className="transaction-list-container">
      {/* Top Header */}
      <div className="list-header-row">
        <div>
          <h2 className="section-title">All Transactions</h2>
          <p className="section-subtitle">
            Complete transaction ledger extracted from statements and added manually.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && onClearAllTransactions && (
            <button
              type="button"
              className="btn btn-secondary btn-sm text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              onClick={onClearAllTransactions}
              title="Clear all transactions from list"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1 inline" /> Clear All
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenAddModal}
          >
            <Plus className="w-4 h-4 mr-1 inline" /> Add Expense
          </button>
          <button
            type="button"
            className="btn btn-primary btn-glow btn-sm"
            onClick={onOpenImportModal}
          >
            <UploadCloud className="w-4 h-4 mr-1 inline" /> Import Statement
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar card-glass">
        <div className="search-box">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by merchant, description, or reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-selects">
          <div className="select-wrapper">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'debit' | 'credit')}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="debit">Debits (Expenses)</option>
              <option value="credit">Credits (Income)</option>
            </select>
          </div>

          <div className="select-wrapper">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <optgroup label="Food & Dining (Combined & Sub)">
                <option value="Food & Dining">🍔 Food (All Combined)</option>
                <option value="Company Canteen">🏢 Company Canteen</option>
                <option value="Vegetables">🥗 Vegetables</option>
                <option value="Tea & Snacks">☕ Tea & Snacks</option>
                <option value="Dining & Delivery">🍽️ Dining & Delivery</option>
              </optgroup>
              <optgroup label="Other Categories">
                {DEFAULT_CATEGORIES
                  .filter(c => !['company_canteen', 'vegetables', 'tea_snacks', 'food'].includes(c.id))
                  .map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
                }
              </optgroup>
            </select>
          </div>

          {categoryFilter !== 'all' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={() => setCategoryFilter('all')}
              title="Reset category filter"
            >
              <span className="text-xs">Reset: <strong>{categoryFilter}</strong></span>
              <span className="text-slate-400 font-bold">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Table of Transactions */}
      {filtered.length === 0 ? (
        <div className="empty-list-card card-glass">
          <p className="text-slate-400">No transactions match your search and filter criteria.</p>
        </div>
      ) : (
        <div className="table-responsive-wrapper card-glass">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Source</th>
                <th>Reference ID</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="tx-table-row">
                  <td className="font-mono text-sm">{formatDisplayDate(t.date)}</td>
                  <td>
                    <div className="desc-group">
                      <strong className="text-slate-100">{t.description}</strong>
                      {t.merchant && t.merchant !== t.description && (
                        <span className="text-xs text-slate-400">{t.merchant}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{t.category}</span>
                    {t.subCategory && t.subCategory !== 'General' && (
                      <span className="subcategory-badge">{t.subCategory}</span>
                    )}
                  </td>
                  <td>
                    <span className="source-tag">{t.sourceStatement || 'Manual'}</span>
                  </td>
                  <td>
                    <span className="ref-text">{t.referenceId || '—'}</span>
                  </td>
                  <td>
                    <span className={`font-semibold ${t.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {t.type === 'credit' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5 inline" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline text-rose-400" />
                      )}
                      {formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-action-btn btn-delete"
                      title="Delete transaction"
                      onClick={() => {
                        if (confirm(`Delete "${t.description}"?`)) {
                          onDeleteTransaction(t.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
