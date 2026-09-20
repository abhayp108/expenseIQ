import React, { useState } from 'react';
import type { Transaction } from '../types/expense.types';
import { formatCurrency, formatDisplayDate } from '../features/statementImport/utils/formatters';
import { 
  X, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink,
  Calendar,
  Building2,
  Salad,
  Coffee,
  Utensils,
  Home,
  Users,
  ShoppingCart,
  Car,
  Tv,
  Zap,
  HeartPulse,
  TrendingUp,
  ArrowLeftRight,
  HelpCircle
} from 'lucide-react';

interface CategoryTransactionsModalProps {
  categoryTitle: string;
  transactions: Transaction[];
  totalDebit: number;
  totalCredit?: number;
  onClose: () => void;
  onOpenInFullTable: (category: string) => void;
}

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  categoryTitle,
  transactions,
  totalDebit,
  totalCredit = 0,
  onClose,
  onOpenInFullTable,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');

  // Filter transactions based on search and type
  const filtered = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchMerch = tx.merchant?.toLowerCase().includes(q);
      const matchSub = tx.subCategory?.toLowerCase().includes(q);
      const matchRef = tx.referenceId?.toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      if (!matchDesc && !matchMerch && !matchSub && !matchRef && !matchAmount) {
        return false;
      }
    }
    return true;
  });

  // Pick an icon based on category title
  const getCategoryIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('canteen')) return <Building2 className="w-5 h-5 text-sky-400" />;
    if (t.includes('vegetable')) return <Salad className="w-5 h-5 text-lime-400" />;
    if (t.includes('tea') || t.includes('snack') || t.includes('nasta')) return <Coffee className="w-5 h-5 text-amber-400" />;
    if (t.includes('food') || t.includes('dining')) return <Utensils className="w-5 h-5 text-orange-400" />;
    if (t.includes('rent')) return <Home className="w-5 h-5 text-indigo-400" />;
    if (t.includes('roommate')) return <Users className="w-5 h-5 text-purple-400" />;
    if (t.includes('grocer')) return <ShoppingCart className="w-5 h-5 text-emerald-400" />;
    if (t.includes('transport')) return <Car className="w-5 h-5 text-cyan-400" />;
    if (t.includes('entertain')) return <Tv className="w-5 h-5 text-pink-400" />;
    if (t.includes('bill') || t.includes('utilit')) return <Zap className="w-5 h-5 text-yellow-400" />;
    if (t.includes('health')) return <HeartPulse className="w-5 h-5 text-teal-400" />;
    if (t.includes('income')) return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    if (t.includes('transfer')) return <ArrowLeftRight className="w-5 h-5 text-blue-400" />;
    return <HelpCircle className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card-glass category-details-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="category-modal-icon-box">
              {getCategoryIcon(categoryTitle)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-100">{categoryTitle}</h3>
                <span className="badge badge-subtle">{transactions.length} txns</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Spent: <strong className="text-rose-400">{formatCurrency(totalDebit)}</strong>
                {totalCredit > 0 && (
                  <span className="ml-2">
                    • Received: <strong className="text-emerald-400">+{formatCurrency(totalCredit)}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="category-modal-toolbar">
          <div className="search-bar category-modal-search">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search in this category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input text-sm"
              autoFocus
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="clear-search-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${filterType === 'debit' ? 'active' : ''}`}
              onClick={() => setFilterType('debit')}
            >
              Debits
            </button>
            {totalCredit > 0 && (
              <button
                type="button"
                className={`type-toggle-btn ${filterType === 'credit' ? 'active' : ''}`}
                onClick={() => setFilterType('credit')}
              >
                Credits
              </button>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="category-modal-tx-list">
          {filtered.length === 0 ? (
            <div className="empty-category-tx">
              <p className="text-slate-400 text-sm">No transactions match your search.</p>
            </div>
          ) : (
            filtered.map((tx) => (
              <div key={tx.id} className="category-modal-tx-row">
                <div className="category-modal-tx-left">
                  <div className={`tx-icon-circle ${tx.type === 'credit' ? 'circle-credit' : 'circle-debit'}`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="category-modal-tx-desc" title={tx.description}>
                      {tx.description}
                    </h5>
                    <div className="category-modal-tx-meta">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDisplayDate(tx.date)}
                      </span>
                      {tx.subCategory && tx.subCategory !== 'General' && (
                        <>
                          <span className="dot-sep">•</span>
                          <span className="subcategory-badge-inline">{tx.subCategory}</span>
                        </>
                      )}
                      {tx.merchant && tx.merchant !== tx.description && (
                        <>
                          <span className="dot-sep">•</span>
                          <span className="text-slate-400 text-xs">{tx.merchant}</span>
                        </>
                      )}
                      {tx.referenceId && (
                        <>
                          <span className="dot-sep">•</span>
                          <span className="text-slate-500 font-mono text-xs">Ref: {tx.referenceId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`category-modal-tx-amount ${tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="category-modal-footer">
          <span className="text-xs text-slate-400">
            Showing {filtered.length} of {transactions.length} transactions
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenInFullTable(categoryTitle)}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1 inline" /> View in All Transactions
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
