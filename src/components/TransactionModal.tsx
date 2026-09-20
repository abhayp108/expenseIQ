import React, { useState } from 'react';
import type { Transaction, TransactionType } from '../types/expense.types';
import { DEFAULT_CATEGORIES } from '../types/expense.types';
import { X, PlusCircle } from 'lucide-react';

interface TransactionModalProps {
  userId: string;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  userId,
  onClose,
  onSave,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('debit');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    onSave({
      userId,
      date,
      description: description.trim(),
      amount: num,
      type,
      category,
      merchant: merchant.trim() || description.trim(),
      referenceId: referenceId.trim() || undefined,
      paymentMethod: 'Manual Entry',
      sourceStatement: 'Manual',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="card-glass manual-tx-modal">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h3>Add Transaction</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="manual-tx-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="input-field"
              >
                <option value="debit">Debit (Expense)</option>
                <option value="credit">Credit (Income)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="e.g. Swiggy, HPCL Petrol, Rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Merchant / Payee (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Swiggy"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Reference / UPI ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 6262145899"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="modal-actions mt-4">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-glow">
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
