import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, X } from 'lucide-react';

interface PasswordPromptModalProps {
  fileName: string;
  errorMessage?: string | null;
  onUnlock: (password: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  fileName,
  errorMessage,
  onUnlock,
  onCancel,
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    onUnlock(password);
  };

  return (
    <div className="modal-backdrop">
      <div className="password-modal card-glass">
        <div className="modal-header">
          <div className="modal-title-lock">
            <div className="lock-icon-wrapper">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3>🔐 This PDF is password protected</h3>
              <p className="file-subtitle">{fileName}</p>
            </div>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onCancel}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          {errorMessage && (
            <div className="password-error-banner">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="pdf-password">PDF Password:</label>
            <div className="password-input-wrapper">
              <input
                id="pdf-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter statement password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                disabled={isLoading}
                className="input-field password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="password-hint">
              Tip: Statements often use your DOB (DDMMYYYY) or PAN or last digits of mobile/account number.
            </p>
          </div>

          <div className="security-notice">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="security-text">
              The password is used only to unlock this file and is not stored.
            </p>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-glow"
              disabled={!password || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner-sm" /> Unlocking...
                </span>
              ) : (
                'Unlock & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
