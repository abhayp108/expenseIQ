import React, { useState } from 'react';
import type { Transaction } from '../types/expense.types';
import { formatCurrency, formatDisplayDate } from '../features/statementImport/utils/formatters';
import { CategoryTransactionsModal } from './CategoryTransactionsModal';
import { SpendingFlowChart } from './SpendingFlowChart';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  UploadCloud, 
  Receipt,
  PieChart,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building2,
  Salad,
  Coffee,
  Utensils,
  ArrowRight,
  Workflow
} from 'lucide-react';

interface DashboardOverviewProps {
  transactions: Transaction[];
  onOpenImportModal: () => void;
  onViewAllTransactions: (category?: string) => void;
  onClearAll?: () => void;
}

// Food subcategory breakdown keys
export type FoodSubcategoryKey = 'Company Canteen' | 'Vegetables' | 'Tea & Snacks' | 'Dining & Delivery';

interface CategoryGroupData {
  name: string;
  amount: number;
  transactions: Transaction[];
  isFood?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  onOpenImportModal,
  onViewAllTransactions,
  onClearAll,
}) => {
  // View mode: 'flowchart' (interactive visual tree) or 'bars' (progress bars)
  const [viewMode, setViewMode] = useState<'flowchart' | 'bars'>('flowchart');

  // State for Food accordion expansion
  const [isFoodExpanded, setIsFoodExpanded] = useState(true);

  // State for category detail modal
  const [activeModalCategory, setActiveModalCategory] = useState<{
    title: string;
    transactions: Transaction[];
    totalDebit: number;
    totalCredit: number;
  } | null>(null);

  // Compute overall totals
  const debitTransactions = transactions.filter(t => t.type === 'debit');
  const creditTransactions = transactions.filter(t => t.type === 'credit');

  const totalDebit = debitTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalCredit - totalDebit;

  // Helper to test if transaction belongs to Food
  const isFoodTx = (t: Transaction): boolean => {
    const cat = (t.category || '').toLowerCase();
    const sub = (t.subCategory || '').toLowerCase();
    return (
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
  };

  // Helper to determine food subcategory
  const getFoodSubcategory = (t: Transaction): FoodSubcategoryKey => {
    const cat = (t.category || '').toLowerCase();
    const sub = (t.subCategory || '').toLowerCase();

    if (cat === 'company canteen' || sub.includes('canteen')) {
      return 'Company Canteen';
    }
    if (cat === 'vegetables' || sub.includes('vegetable')) {
      return 'Vegetables';
    }
    if (cat === 'tea & snacks' || sub.includes('tea') || sub.includes('nasta') || sub.includes('chai')) {
      return 'Tea & Snacks';
    }
    return 'Dining & Delivery';
  };

  // Group food debits into subcategories
  const foodBreakdown: Record<FoodSubcategoryKey, { amount: number; transactions: Transaction[] }> = {
    'Company Canteen': { amount: 0, transactions: [] },
    'Vegetables': { amount: 0, transactions: [] },
    'Tea & Snacks': { amount: 0, transactions: [] },
    'Dining & Delivery': { amount: 0, transactions: [] },
  };

  const allFoodTransactions: Transaction[] = [];
  let totalFoodDebit = 0;

  // Group non-food debits
  const nonFoodGroups: Record<string, { amount: number; transactions: Transaction[] }> = {};

  debitTransactions.forEach(t => {
    if (isFoodTx(t)) {
      const subKey = getFoodSubcategory(t);
      foodBreakdown[subKey].amount += t.amount;
      foodBreakdown[subKey].transactions.push(t);
      allFoodTransactions.push(t);
      totalFoodDebit += t.amount;
    } else {
      const cat = t.category || 'Uncategorized';
      if (!nonFoodGroups[cat]) {
        nonFoodGroups[cat] = { amount: 0, transactions: [] };
      }
      nonFoodGroups[cat].amount += t.amount;
      nonFoodGroups[cat].transactions.push(t);
    }
  });

  // Build sorted list of category items for the dashboard
  const categoryItems: CategoryGroupData[] = [];

  // Add Food as a main category if there are food debits
  if (totalFoodDebit > 0) {
    categoryItems.push({
      name: 'Food & Dining',
      amount: totalFoodDebit,
      transactions: allFoodTransactions,
      isFood: true,
    });
  }

  // Add all other categories
  Object.entries(nonFoodGroups).forEach(([catName, data]) => {
    categoryItems.push({
      name: catName,
      amount: data.amount,
      transactions: data.transactions,
      isFood: false,
    });
  });

  // Sort descending by amount
  categoryItems.sort((a, b) => b.amount - a.amount);

  // Helper to open modal for any category or subcategory
  const openCategoryModal = (
    title: string, 
    matchingTransactions: Transaction[], 
    customDebit?: number
  ) => {
    // Also include any credit transactions in this category if applicable
    const categoryCredits = transactions.filter(t => {
      if (t.type !== 'credit') return false;
      if (title === 'Food' || title === 'Food & Dining') {
        return isFoodTx(t);
      }
      if (title === 'Company Canteen') return getFoodSubcategory(t) === 'Company Canteen';
      if (title === 'Vegetables') return getFoodSubcategory(t) === 'Vegetables';
      if (title === 'Tea & Snacks') return getFoodSubcategory(t) === 'Tea & Snacks';
      if (title === 'Dining & Delivery') return getFoodSubcategory(t) === 'Dining & Delivery';
      return t.category === title;
    });

    const combinedList = [...matchingTransactions, ...categoryCredits];
    const computedDebit = customDebit ?? matchingTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const computedCredit = categoryCredits.reduce((s, t) => s + t.amount, 0);

    setActiveModalCategory({
      title,
      transactions: combinedList,
      totalDebit: computedDebit,
      totalCredit: computedCredit,
    });
  };

  const recentTransactions = transactions.slice(0, 8);

  return (
    <div className="dashboard-container">
      {/* Top 3 Summary Cards */}
      <div className="metrics-grid simple-metrics-grid">
        <div className="metric-card card-glass">
          <div className="metric-header">
            <span className="metric-title">Total Money Spent</span>
            <div className="metric-icon-box bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value text-rose-400">{formatCurrency(totalDebit)}</div>
          <div className="metric-subtext">{debitTransactions.length} payments / debits</div>
        </div>

        <div className="metric-card card-glass">
          <div className="metric-header">
            <span className="metric-title">Total Money Received</span>
            <div className="metric-icon-box bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="metric-value text-emerald-400">{formatCurrency(totalCredit)}</div>
          <div className="metric-subtext">{creditTransactions.length} deposits / credits</div>
        </div>

        <div className="metric-card card-glass">
          <div className="metric-header">
            <span className="metric-title">Net Cash Flow</span>
            <div className="metric-icon-box bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className={`metric-value ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netBalance)}
          </div>
          <div className="metric-subtext">{transactions.length} total recorded transactions</div>
        </div>
      </div>

      {/* Main Content Area */}
      {transactions.length === 0 ? (
        <div className="empty-dashboard-card card-glass">
          <div className="empty-icon-box">
            <UploadCloud className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Transactions Yet</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm">
            Import your PhonePe statement to instantly see your spend analytics, category breakdowns, and transaction history.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-glow"
            onClick={onOpenImportModal}
          >
            <UploadCloud className="w-4 h-4 mr-2 inline" /> Import PhonePe Statement (PDF)
          </button>
        </div>
      ) : (
        <div className={`dashboard-simple-grid ${viewMode === 'flowchart' ? 'flowchart-active' : ''}`}>
          {/* Left: Category Breakdown / Flow Chart */}
          <div className="dashboard-section card-glass">
            <div className="section-header">
              <div className="flex items-center gap-2">
                {viewMode === 'flowchart' ? (
                  <Workflow className="w-5 h-5 text-indigo-400" />
                ) : (
                  <PieChart className="w-5 h-5 text-indigo-400" />
                )}
                <h3 className="section-title">Spending Breakdown</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="view-mode-toggle-group">
                  <button
                    type="button"
                    className={`view-mode-tab-btn ${viewMode === 'flowchart' ? 'active' : ''}`}
                    onClick={() => setViewMode('flowchart')}
                    title="Interactive Flow Chart with colored branches & red max traction"
                  >
                    <Workflow className="w-3.5 h-3.5" /> Flow Chart
                  </button>
                  <button
                    type="button"
                    className={`view-mode-tab-btn ${viewMode === 'bars' ? 'active' : ''}`}
                    onClick={() => setViewMode('bars')}
                    title="Category progress bars & food accordion"
                  >
                    <PieChart className="w-3.5 h-3.5" /> Progress Bars
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'flowchart' ? (
              <SpendingFlowChart
                transactions={transactions}
                totalDebit={totalDebit}
                categoryItems={categoryItems}
                foodBreakdown={foodBreakdown}
                totalFoodDebit={totalFoodDebit}
                onSelectCategory={(title, txs, debit) => openCategoryModal(title, txs, debit)}
              />
            ) : (
              <div className="category-bars-list">
              {categoryItems.map(item => {
                const percent = totalDebit > 0 ? Math.round((item.amount / totalDebit) * 100) : 0;

                // SPECIAL ACCORDION FOR FOOD & DINING
                if (item.isFood) {
                  return (
                    <div 
                      key="food-main" 
                      className={`food-accordion-card ${isFoodExpanded ? 'expanded' : ''}`}
                    >
                      {/* Parent Food Row */}
                      <div 
                        className="food-accordion-header"
                        onClick={() => setIsFoodExpanded(!isFoodExpanded)}
                        title="Click to toggle food sub-categories"
                      >
                        <div className="category-bar-label-group">
                          <div className="category-name-group">
                            <Utensils className="w-4 h-4 text-orange-400" />
                            <span className="category-name">Food (Combined)</span>
                            <span className="category-sub-badge">
                              4 Sub-categories
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="category-amount">
                              {formatCurrency(item.amount)} <span className="category-pct">({percent}%)</span>
                            </span>
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsFoodExpanded(!isFoodExpanded);
                              }}
                              aria-label="Toggle subcategories"
                            >
                              {isFoodExpanded ? (
                                <ChevronUp className="w-4 h-4 text-orange-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Combined progress bar */}
                        <div className="progress-track">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${Math.max(percent, 2)}%`,
                              background: 'linear-gradient(90deg, #f97316, #fb923c)'
                            }}
                          />
                        </div>
                      </div>

                      {/* Expandable Subcategories List */}
                      {isFoodExpanded && (
                        <div className="food-subcategories-list">
                          {/* 1. Company Canteen */}
                          <div 
                            className="food-sub-item"
                            onClick={() => openCategoryModal('Company Canteen', foodBreakdown['Company Canteen'].transactions, foodBreakdown['Company Canteen'].amount)}
                            title="Click to view Company Canteen transactions"
                          >
                            <div className="food-sub-label-group">
                              <span className="food-sub-name">
                                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                                Company Canteen
                              </span>
                              <span className="food-sub-amount">
                                {formatCurrency(foodBreakdown['Company Canteen'].amount)}
                                <span className="food-sub-pct">
                                  {' '}({totalFoodDebit > 0 ? Math.round((foodBreakdown['Company Canteen'].amount / totalFoodDebit) * 100) : 0}% of food)
                                </span>
                              </span>
                            </div>
                            <div className="food-sub-track">
                              <div 
                                className="food-sub-fill bg-sky-500" 
                                style={{ width: `${totalFoodDebit > 0 ? Math.max((foodBreakdown['Company Canteen'].amount / totalFoodDebit) * 100, 2) : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* 2. Vegetables */}
                          <div 
                            className="food-sub-item"
                            onClick={() => openCategoryModal('Vegetables', foodBreakdown['Vegetables'].transactions, foodBreakdown['Vegetables'].amount)}
                            title="Click to view Vegetables transactions"
                          >
                            <div className="food-sub-label-group">
                              <span className="food-sub-name">
                                <Salad className="w-3.5 h-3.5 text-lime-400" />
                                Vegetables
                              </span>
                              <span className="food-sub-amount">
                                {formatCurrency(foodBreakdown['Vegetables'].amount)}
                                <span className="food-sub-pct">
                                  {' '}({totalFoodDebit > 0 ? Math.round((foodBreakdown['Vegetables'].amount / totalFoodDebit) * 100) : 0}% of food)
                                </span>
                              </span>
                            </div>
                            <div className="food-sub-track">
                              <div 
                                className="food-sub-fill bg-lime-500" 
                                style={{ width: `${totalFoodDebit > 0 ? Math.max((foodBreakdown['Vegetables'].amount / totalFoodDebit) * 100, 2) : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* 3. Tea & Snacks */}
                          <div 
                            className="food-sub-item"
                            onClick={() => openCategoryModal('Tea & Snacks', foodBreakdown['Tea & Snacks'].transactions, foodBreakdown['Tea & Snacks'].amount)}
                            title="Click to view Tea & Snacks transactions"
                          >
                            <div className="food-sub-label-group">
                              <span className="food-sub-name">
                                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                                Tea & Snacks (Chai & Nasta)
                              </span>
                              <span className="food-sub-amount">
                                {formatCurrency(foodBreakdown['Tea & Snacks'].amount)}
                                <span className="food-sub-pct">
                                  {' '}({totalFoodDebit > 0 ? Math.round((foodBreakdown['Tea & Snacks'].amount / totalFoodDebit) * 100) : 0}% of food)
                                </span>
                              </span>
                            </div>
                            <div className="food-sub-track">
                              <div 
                                className="food-sub-fill bg-amber-500" 
                                style={{ width: `${totalFoodDebit > 0 ? Math.max((foodBreakdown['Tea & Snacks'].amount / totalFoodDebit) * 100, 2) : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* 4. Dining & Delivery */}
                          <div 
                            className="food-sub-item"
                            onClick={() => openCategoryModal('Dining & Delivery', foodBreakdown['Dining & Delivery'].transactions, foodBreakdown['Dining & Delivery'].amount)}
                            title="Click to view Dining & Delivery transactions"
                          >
                            <div className="food-sub-label-group">
                              <span className="food-sub-name">
                                <Utensils className="w-3.5 h-3.5 text-orange-400" />
                                Dining & Delivery (Swiggy, Zomato, Cafes)
                              </span>
                              <span className="food-sub-amount">
                                {formatCurrency(foodBreakdown['Dining & Delivery'].amount)}
                                <span className="food-sub-pct">
                                  {' '}({totalFoodDebit > 0 ? Math.round((foodBreakdown['Dining & Delivery'].amount / totalFoodDebit) * 100) : 0}% of food)
                                </span>
                              </span>
                            </div>
                            <div className="food-sub-track">
                              <div 
                                className="food-sub-fill bg-orange-500" 
                                style={{ width: `${totalFoodDebit > 0 ? Math.max((foodBreakdown['Dining & Delivery'].amount / totalFoodDebit) * 100, 2) : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Quick action: View all food transactions */}
                          <div className="food-sub-actions">
                            <button
                              type="button"
                              className="view-all-food-btn"
                              onClick={() => openCategoryModal('Food & Dining', item.transactions, item.amount)}
                            >
                              View All Food Transactions ({item.transactions.length})
                              <ArrowRight className="w-3 h-3 ml-1 inline" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // REGULAR CATEGORIES (Flat Rent, Roommate, Health & Wellness, Groceries, etc.)
                return (
                  <div 
                    key={item.name} 
                    className="category-bar-item"
                    onClick={() => openCategoryModal(item.name, item.transactions, item.amount)}
                    title={`Click to view all ${item.name} transactions`}
                  >
                    <div className="category-bar-label-group">
                      <div className="category-name-group">
                        <span className="category-name">{item.name}</span>
                        <span className="category-click-hint">
                          View txns <ArrowRight className="w-3 h-3 inline" />
                        </span>
                      </div>
                      <span className="category-amount">
                        {formatCurrency(item.amount)} <span className="category-pct">({percent}%)</span>
                      </span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>

          {/* Right: Recent Transactions List */}
          <div className="dashboard-section card-glass">
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h3 className="section-title">Recent Transactions</h3>
              </div>
              <div className="flex items-center gap-3">
                {transactions.length > 8 && (
                  <button
                    type="button"
                    className="view-all-btn"
                    onClick={() => onViewAllTransactions()}
                  >
                    View All ({transactions.length})
                  </button>
                )}
                {onClearAll && (
                  <button
                    type="button"
                    className="clear-all-text-btn"
                    title="Clear all transactions"
                    onClick={onClearAll}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1 inline" /> Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="recent-tx-list">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="recent-tx-row">
                  <div className="recent-tx-left">
                    <div className={`tx-icon-circle ${tx.type === 'credit' ? 'circle-credit' : 'circle-debit'}`}>
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <h5 className="recent-tx-desc" title={tx.description}>{tx.description}</h5>
                      <div className="recent-tx-meta">
                        <span>{formatDisplayDate(tx.date)}</span>
                        <span className="dot-sep">•</span>
                        <span className="category-subtle">{tx.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`recent-tx-amount ${tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Showing {recentTransactions.length} of {transactions.length} transactions
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenImportModal}
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1 inline" /> Import More
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Transactions Drilldown Modal */}
      {activeModalCategory && (
        <CategoryTransactionsModal
          categoryTitle={activeModalCategory.title}
          transactions={activeModalCategory.transactions}
          totalDebit={activeModalCategory.totalDebit}
          totalCredit={activeModalCategory.totalCredit}
          onClose={() => setActiveModalCategory(null)}
          onOpenInFullTable={(cat) => {
            setActiveModalCategory(null);
            onViewAllTransactions(cat);
          }}
        />
      )}
    </div>
  );
};
