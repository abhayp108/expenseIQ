import React from 'react';
import { 
  Compass, 
  UploadCloud, 
  Receipt, 
  History, 
  Shield, 
  User, 
  LogOut,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'dashboard' | 'transactions' | 'history';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'history') => void;
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenImportModal,
  onOpenAddModal,
}) => {
  const { user, isDemoMode, logout } = useAuth();

  return (
    <header className="navbar-container card-glass">
      <div className="navbar-content">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => setActiveTab('dashboard')}>
          <div className="brand-logo-box">
            <Compass className="w-6 h-6 text-indigo-400 brand-icon" />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">Expense<span className="text-indigo-400">IQ</span></span>
            <span className="brand-tagline">Financial Intelligence</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          <button
            type="button"
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <Receipt className="w-4 h-4 mr-1 inline" />
            Transactions
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4 mr-1 inline" />
            Import History
          </button>
        </nav>

        {/* Action Buttons & User Profile */}
        <div className="navbar-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenAddModal}
            title="Add transaction manually"
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

          {/* User profile dropdown / pill */}
          <div className="user-profile-chip">
            <div className="user-avatar">
              <User className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="user-meta">
              <span className="user-name">{user?.displayName || 'Alex Rivera'}</span>
              {isDemoMode && (
                <span className="demo-badge">
                  <Shield className="w-2.5 h-2.5 mr-0.5 inline" /> Local Mode
                </span>
              )}
            </div>
            <button
              type="button"
              className="logout-btn"
              onClick={logout}
              title="Logout / Reset"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
