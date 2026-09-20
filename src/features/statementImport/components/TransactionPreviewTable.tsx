import React, { useState } from 'react';
import type { ParsedTransaction } from '../types/statement.types';
import { DuplicateBadge } from './DuplicateBadge';
import { formatCurrency, formatDisplayDate } from '../utils/formatters';
import { DEFAULT_CATEGORIES } from '../../../types/expense.types';
import { Trash2, Edit3, Check, X, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

interface TransactionPreviewTableProps {
  transactions: ParsedTransaction[];
  onToggleSelect: (id: string) => void;
  onUpdateTransaction: (id: string, updated: Partial<ParsedTransaction>) => void;
  onIgnoreTransaction: (id: string) => void;
  onRestoreTransaction: (id: string) => void;
}

export const TransactionPreviewTable: React.FC<TransactionPreviewTableProps> = ({
  transactions,
  onToggleSelect,
  onUpdateTransaction,
  onIgnoreTransaction,
  onRestoreTransaction,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ParsedTransaction>>({});

  const startEdit = (tx: ParsedTransaction) => {
    setEditingId(tx.id);
    setEditForm({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      subCategory: tx.subCategory,
    });
  };

  const saveEdit = (id: string) => {
    if (editForm.amount !== undefined && editForm.amount <= 0) {
      alert('Amount must be greater than zero');
      return;
    }
    onUpdateTransaction(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (transactions.length === 0) {
    return (
      <div className="empty-preview-state card-glass">
        <p>No transactions match the selected filter.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive-wrapper card-glass">
      <table className="preview-table">
        <thead>
          <tr>
            <th className="th-select">Select</th>
            <th className="th-date">Date</th>
            <th className="th-desc">Description</th>
            <th className="th-amount">Amount</th>
            <th className="th-type">Type</th>
            <th className="th-category">Category</th>
            <th className="th-status">Status</th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => {
            const isEditing = editingId === tx.id;
            const isIgnored = tx.isIgnored;

            return (
              <tr 
                key={tx.id} 
                className={`preview-row ${tx.isDuplicate ? 'row-duplicate' : ''} ${isIgnored ? 'row-ignored' : ''} ${tx.isSelected ? 'row-selected' : ''}`}
              >
                {/* Select Checkbox */}
                <td className="td-select">
                  <input
                    type="checkbox"
                    checked={Boolean(tx.isSelected && !isIgnored)}
                    disabled={isIgnored}
                    onChange={() => onToggleSelect(tx.id)}
                    className="custom-checkbox"
                    aria-label={`Select ${tx.description}`}
                  />
                </td>

                {/* Date */}
                <td className="td-date">
                  {isEditing ? (
                    <input
                      type="date"
                      className="table-input"
                      value={editForm.date || tx.date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  ) : (
                    <span className="font-mono text-sm">{formatDisplayDate(tx.date)}</span>
                  )}
                </td>

                {/* Description */}
                <td className="td-desc">
                  {isEditing ? (
                    <input
                      type="text"
                      className="table-input"
                      value={editForm.description ?? tx.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  ) : (
                    <div className="desc-cell">
                      <span className="desc-main" title={tx.description}>{tx.description}</span>
                      {tx.merchant && tx.merchant !== tx.description && (
                        <span className="desc-merchant">{tx.merchant}</span>
                      )}
                      {tx.referenceId && (
                        <span className="desc-ref">Ref: {tx.referenceId}</span>
                      )}
                    </div>
                  )}
                </td>

                {/* Amount */}
                <td className="td-amount">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="table-input"
                      value={editForm.amount ?? tx.amount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    />
                  ) : (
                    <span className={`amount-value ${tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {formatCurrency(tx.amount)}
                    </span>
                  )}
                </td>

                {/* Type */}
                <td className="td-type">
                  {isEditing ? (
                    <select
                      className="table-select"
                      value={editForm.type || tx.type}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as 'debit' | 'credit' }))}
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  ) : (
                    <span className={`type-tag ${tx.type === 'credit' ? 'tag-credit' : 'tag-debit'}`}>
                      {tx.type === 'credit' ? (
                        <><ArrowDownLeft className="w-3 h-3 mr-1 inline" /> Credit</>
                      ) : (
                        <><ArrowUpRight className="w-3 h-3 mr-1 inline" /> Debit</>
                      )}
                    </span>
                  )}
                </td>

                {/* Category */}
                <td className="td-category">
                  {isEditing ? (
                    <select
                      className="table-select"
                      value={editForm.category || tx.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const catDef = DEFAULT_CATEGORIES.find(c => c.name === newCat);
                        setEditForm(prev => ({
                          ...prev,
                          category: newCat,
                          subCategory: catDef?.subCategories[0] || 'General',
                        }));
                      }}
                    >
                      {DEFAULT_CATEGORIES.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="category-cell">
                      <span className="category-badge">
                        {tx.category}
                      </span>
                      {tx.subCategory && tx.subCategory !== 'General' && (
                        <span className="subcategory-badge">{tx.subCategory}</span>
                      )}
                    </div>
                  )}
                </td>

                {/* Status / Duplicate */}
                <td className="td-status">
                  <DuplicateBadge isDuplicate={tx.isDuplicate} reason={tx.duplicateReason} />
                </td>

                {/* Actions */}
                <td className="td-actions">
                  {isEditing ? (
                    <div className="table-actions-group">
                      <button
                        type="button"
                        className="icon-action-btn btn-save"
                        title="Save changes"
                        onClick={() => saveEdit(tx.id)}
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn btn-cancel"
                        title="Cancel edit"
                        onClick={cancelEdit}
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="table-actions-group">
                      <button
                        type="button"
                        className="icon-action-btn btn-edit"
                        title="Edit transaction"
                        onClick={() => startEdit(tx)}
                        disabled={isIgnored}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {isIgnored ? (
                        <button
                          type="button"
                          className="icon-action-btn btn-restore"
                          title="Restore transaction"
                          onClick={() => onRestoreTransaction(tx.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="icon-action-btn btn-ignore"
                          title="Ignore transaction"
                          onClick={() => onIgnoreTransaction(tx.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
