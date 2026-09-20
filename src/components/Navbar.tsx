import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  UploadCloud, 
  Receipt, 
  History, 
  Shield, 
  User, 
  LogOut,
  Plus,
  Menu,
  X,
  LayoutDashboard
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 868) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (tab: 'dashboard' | 'transactions' | 'history') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`navbar-container card-glass ${isMobileMenuOpen ? 'mobile-menu-expanded' : ''}`}>
      <div className="navbar-content">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => handleNavClick('dashboard')}>
          <div className="brand-logo-box">
            <Compass className="w-5 h-5 brand-icon" />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">
              Expense<span className="text-indigo-400">IQ</span>
            </span>
            <span className="brand-tagline">Financial Intelligence</span>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Hidden on mobile) */}
        <nav className="navbar-nav desktop-nav">
          <button
            type="button"
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => handleNavClick('transactions')}
          >
            <Receipt className="w-4 h-4 mr-1 inline" />
            Transactions
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleNavClick('history')}
          >
            <History className="w-4 h-4 mr-1 inline" />
            Import History
          </button>
        </nav>

        {/* Desktop Action Buttons & User Profile (Hidden on mobile) */}
        <div className="navbar-actions desktop-actions">
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

          {/* User profile dropdown / chip */}
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

        {/* Mobile Header Controls (Visible only on phone/tablet) */}
        <div className="mobile-header-controls">
          <button
            type="button"
            className="mobile-quick-btn"
            onClick={onOpenAddModal}
            title="Add Expense"
            aria-label="Add Expense"
          >
            <Plus className="w-4 h-4 text-indigo-300" />
          </button>

          <button
            type="button"
            className="mobile-quick-btn btn-import-quick"
            onClick={onOpenImportModal}
            title="Import Statement"
            aria-label="Import Statement"
          >
            <UploadCloud className="w-4 h-4 text-indigo-300" />
          </button>

          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-indigo-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-dropdown-menu">
          {/* Navigation Links */}
          <div className="mobile-nav-links">
            <button
              type="button"
              className={`mobile-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`mobile-nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => handleNavClick('transactions')}
            >
              <Receipt className="w-4 h-4 text-indigo-400" />
              <span>Transactions</span>
            </button>

            <button
              type="button"
              className={`mobile-nav-link ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => handleNavClick('history')}
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>Import History</span>
            </button>
          </div>

          <div className="mobile-actions-divider" />

          {/* Quick Action Buttons */}
          <div className="mobile-actions-group">
            <button
              type="button"
              className="btn btn-secondary w-full justify-center"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAddModal();
              }}
            >
              <Plus className="w-4 h-4 mr-1.5 inline" /> Add Expense
            </button>

            <button
              type="button"
              className="btn btn-primary btn-glow w-full justify-center"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenImportModal();
              }}
            >
              <UploadCloud className="w-4 h-4 mr-1.5 inline" /> Import Statement (PDF)
            </button>
          </div>

          <div className="mobile-actions-divider" />

          {/* Mobile User Profile & Logout */}
          <div className="mobile-user-row">
            <div className="flex items-center gap-2.5">
              <div className="user-avatar">
                <User className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <div className="user-name text-sm font-semibold">{user?.displayName || 'Alex Rivera'}</div>
                {isDemoMode && (
                  <span className="demo-badge text-xs">
                    <Shield className="w-2.5 h-2.5 mr-0.5 inline" /> Local Demo Mode
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-1 inline" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
