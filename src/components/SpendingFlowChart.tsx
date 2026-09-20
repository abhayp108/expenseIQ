import React, { useRef, useState, useEffect } from 'react';
import type { Transaction } from '../types/expense.types';
import { formatCurrency } from '../features/statementImport/utils/formatters';
import type { FoodSubcategoryKey } from './DashboardOverview';
import { 
  Wallet, 
  Flame, 
  Utensils, 
  Building2, 
  Salad, 
  Coffee, 
  Home, 
  Users, 
  ShoppingCart, 
  Car, 
  Tv, 
  Zap, 
  HeartPulse, 
  TrendingUp, 
  ArrowLeftRight, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface CategoryData {
  name: string;
  amount: number;
  transactions: Transaction[];
  isFood?: boolean;
}

interface SpendingFlowChartProps {
  transactions: Transaction[];
  totalDebit: number;
  categoryItems: CategoryData[];
  foodBreakdown: Record<FoodSubcategoryKey, { amount: number; transactions: Transaction[] }>;
  totalFoodDebit: number;
  onSelectCategory: (title: string, txs: Transaction[], debit: number) => void;
}

export const SpendingFlowChart: React.FC<SpendingFlowChartProps> = ({
  transactions: _transactions,
  totalDebit,
  categoryItems,
  foodBreakdown,
  totalFoodDebit,
  onSelectCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 900, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Find the category with maximum traction (highest debit spend)
  const maxTractionCategory = categoryItems.reduce<CategoryData | null>((max, curr) => {
    if (!max || curr.amount > max.amount) return curr;
    return max;
  }, null);

  // Food subcategories list
  const foodSubcategories: { key: FoodSubcategoryKey; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'Company Canteen', label: 'Company Canteen', icon: <Building2 className="w-3.5 h-3.5" />, color: '#0284c7' },
    { key: 'Vegetables', label: 'Vegetables', icon: <Salad className="w-3.5 h-3.5" />, color: '#84cc16' },
    { key: 'Tea & Snacks', label: 'Tea & Snacks', icon: <Coffee className="w-3.5 h-3.5" />, color: '#f59e0b' },
    { key: 'Dining & Delivery', label: 'Dining & Delivery', icon: <Utensils className="w-3.5 h-3.5" />, color: '#f97316' },
  ];

  // Helper to pick category icon
  const getCategoryIcon = (name: string, isMax: boolean) => {
    if (isMax) return <Flame className="w-4 h-4 text-rose-500 animate-pulse" />;
    const n = name.toLowerCase();
    if (n.includes('food')) return <Utensils className="w-4 h-4 text-orange-400" />;
    if (n.includes('rent')) return <Home className="w-4 h-4 text-indigo-400" />;
    if (n.includes('roommate')) return <Users className="w-4 h-4 text-purple-400" />;
    if (n.includes('grocer')) return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
    if (n.includes('transport')) return <Car className="w-4 h-4 text-cyan-400" />;
    if (n.includes('entertain')) return <Tv className="w-4 h-4 text-pink-400" />;
    if (n.includes('bill') || n.includes('utilit')) return <Zap className="w-4 h-4 text-yellow-400" />;
    if (n.includes('health')) return <HeartPulse className="w-4 h-4 text-teal-400" />;
    if (n.includes('income')) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (n.includes('transfer')) return <ArrowLeftRight className="w-4 h-4 text-blue-400" />;
    return <HelpCircle className="w-4 h-4 text-slate-400" />;
  };

  // Helper to pick category theme color
  const getCategoryColor = (name: string, isMax: boolean) => {
    if (isMax) return '#ef4444'; // RED for maximum traction!
    const n = name.toLowerCase();
    if (n.includes('food')) return '#f97316';
    if (n.includes('rent')) return '#6366f1';
    if (n.includes('roommate')) return '#8b5cf6';
    if (n.includes('grocer')) return '#10b981';
    if (n.includes('transport')) return '#06b6d4';
    if (n.includes('entertain')) return '#ec4899';
    if (n.includes('bill') || n.includes('utilit')) return '#eab308';
    if (n.includes('health')) return '#14b8a6';
    return '#64748b';
  };

  // Keep SVG canvas sized to container on desktop
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSvgDimensions({
          width: Math.max(rect.width, 850),
          height: Math.max(categoryItems.length * 80 + 100, 520),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [categoryItems.length]);

  // Layout calculation for desktop SVG
  const totalHeight = Math.max(categoryItems.length * 82 + 60, 520);
  const rootX = 140;
  const rootY = totalHeight / 2;
  const catX = 460;
  const subX = 780;

  // Calculate Y positions for categories
  const catSpacing = totalHeight / (categoryItems.length + 1);
  const catPositions = categoryItems.map((item, idx) => ({
    ...item,
    x: catX,
    y: (idx + 1) * catSpacing,
    isMax: maxTractionCategory?.name === item.name,
  }));

  // Find Food position for subcategories
  const foodCat = catPositions.find(c => c.isFood);
  const foodY = foodCat ? foodCat.y : rootY;

  // Food subcategory positions clustered around foodY
  const subPositions = foodSubcategories.map((sub, idx) => {
    const offset = (idx - 1.5) * 62;
    return {
      ...sub,
      x: subX,
      y: Math.max(50, Math.min(totalHeight - 50, foodY + offset)),
      amount: foodBreakdown[sub.key].amount,
      txCount: foodBreakdown[sub.key].transactions.length,
      txs: foodBreakdown[sub.key].transactions,
    };
  });

  return (
    <div className="spending-flowchart-wrapper card-glass">
      {/* Chart Header & Legend */}
      <div className="flowchart-header">
        <div>
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Spending Flow Chart</span>
            <span className="badge badge-subtle">Interactive Diagram</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Visual cash outflow from Total Spend into Categories and Food Sub-branches. Tap any card to view transactions.
          </p>
        </div>

        <div className="flowchart-legend">
          <div className="legend-item legend-max-traction">
            <span className="legend-dot bg-rose-500 animate-ping" />
            <span className="legend-dot bg-rose-500" />
            <strong className="text-rose-400">Maximum Traction (Highest Expense)</strong>
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-indigo-500" />
            <span className="text-slate-300">Standard Categories</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-orange-500" />
            <span className="text-slate-300">Food Sub-branches</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW: Native Vertical Flow Tree (Zero horizontal overflow)
          ========================================================================= */}
      <div className="mobile-flowchart">
        {/* 1. Root Master Node (Total Spend) */}
        <div 
          className="mobile-flow-root"
          onClick={() => onSelectCategory('All Spending', categoryItems.flatMap(c => c.transactions), totalDebit)}
          title="Tap to view all spending transactions"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flow-node-icon bg-indigo-500/20 text-indigo-400 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-400 block truncate">Total Outflow</span>
                <strong className="text-base sm:text-lg text-rose-400 font-bold block truncate">{formatCurrency(totalDebit)}</strong>
              </div>
            </div>
            <span className="badge badge-subtle text-[11px] shrink-0">100% of Expenses</span>
          </div>
        </div>

        {/* Stem down to categories */}
        <div className="mobile-flow-stem" />

        {/* 2. Category Flow Tree Branches */}
        <div className="mobile-flow-categories">
          {catPositions.map(cat => {
            const percent = totalDebit > 0 ? Math.round((cat.amount / totalDebit) * 100) : 0;
            const color = getCategoryColor(cat.name, cat.isMax);

            return (
              <div key={cat.name} className="mobile-flow-branch">
                {/* Horizontal branch connector */}
                <div 
                  className="mobile-branch-line" 
                  style={{ borderColor: cat.isMax ? '#ef4444' : color }} 
                />

                {/* Category Card */}
                <div
                  className={`mobile-flow-card ${cat.isMax ? 'node-max-traction' : ''}`}
                  onClick={() => onSelectCategory(cat.name, cat.transactions, cat.amount)}
                >
                  {/* Red Badge for Maximum Traction */}
                  {cat.isMax && (
                    <div className="max-traction-badge-mobile">
                      <Flame className="w-3 h-3 text-white animate-pulse" />
                      <span>MAXIMUM TRACTION</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="flow-node-icon shrink-0"
                        style={{ 
                          background: cat.isMax ? 'rgba(239, 68, 68, 0.2)' : `${color}20`,
                          color: cat.isMax ? '#ef4444' : color,
                          borderColor: cat.isMax ? '#ef4444' : undefined,
                        }}
                      >
                        {getCategoryIcon(cat.name, cat.isMax)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className={`text-sm font-semibold truncate ${cat.isMax ? 'text-rose-200 font-bold' : 'text-slate-100'}`}>
                            {cat.name}
                          </strong>
                          {cat.isFood && <span className="sub-count-chip shrink-0">4 Sub</span>}
                        </div>
                        <span className="text-xs text-slate-400 block truncate">
                          {percent}% of spend • {cat.transactions.length} txns
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold ${cat.isMax ? 'text-rose-400 font-extrabold' : 'text-slate-100'}`}>
                        {formatCurrency(cat.amount)}
                      </div>
                      <span className="text-indigo-400 text-xs flex items-center justify-end gap-0.5 mt-0.5">
                        View <ExternalLink className="w-2.5 h-2.5 inline" />
                      </span>
                    </div>
                  </div>

                  {/* If Food Category: Show Nested Sub-branches in clean cards */}
                  {cat.isFood && (
                    <div className="mobile-subcategories-group">
                      <div className="mobile-sub-header">
                        <span>Food Sub-branches</span>
                        <span className="text-slate-400">({formatCurrency(totalFoodDebit)})</span>
                      </div>
                      <div className="mobile-sub-grid">
                        {subPositions.map(sub => {
                          const subPct = totalFoodDebit > 0 ? Math.round((sub.amount / totalFoodDebit) * 100) : 0;
                          return (
                            <div
                              key={sub.key}
                              className="mobile-sub-card min-w-0"
                              style={{ borderLeftColor: sub.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCategory(sub.label, sub.txs, sub.amount);
                              }}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span style={{ color: sub.color }} className="shrink-0">{sub.icon}</span>
                                <span className="text-xs font-medium text-slate-200 truncate">{sub.label}</span>
                              </div>
                              <div className="text-xs font-bold text-slate-100 mt-1 flex items-baseline justify-between">
                                <span className="truncate">{formatCurrency(sub.amount)}</span>
                                <span className="text-slate-400 font-normal text-[10px] ml-1 shrink-0">({subPct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW: Horizontal SVG Canvas with Flow Curves (Hidden on mobile)
          ========================================================================= */}
      <div 
        ref={containerRef} 
        className="flowchart-canvas-container desktop-flowchart"
        style={{ minHeight: `${totalHeight}px` }}
      >
        <svg 
          className="flowchart-svg" 
          width={svgDimensions.width} 
          height={totalHeight}
          viewBox={`0 0 ${svgDimensions.width} ${totalHeight}`}
        >
          <defs>
            {/* Linear gradients for connectors */}
            <linearGradient id="grad-root-to-cat" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="grad-max-traction" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="grad-food-sub" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.4" />
            </linearGradient>

            {/* Red glow filter for max traction connector */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connectors: Root -> Categories */}
          {catPositions.map(cat => {
            const isHovered = hoveredNode === cat.name || hoveredNode === 'root';
            const dx = (cat.x - rootX) * 0.45;
            const pathD = `M ${rootX + 75} ${rootY} C ${rootX + 75 + dx} ${rootY}, ${cat.x - 75 - dx} ${cat.y}, ${cat.x - 75} ${cat.y}`;

            return (
              <path
                key={`line-root-${cat.name}`}
                d={pathD}
                fill="none"
                stroke={cat.isMax ? 'url(#grad-max-traction)' : (isHovered ? '#a5b4fc' : 'rgba(255, 255, 255, 0.12)')}
                strokeWidth={cat.isMax ? 3.5 : (isHovered ? 2.5 : 1.5)}
                strokeDasharray={cat.isMax ? '6 3' : 'none'}
                filter={cat.isMax ? 'url(#glow-red)' : undefined}
                className={cat.isMax ? 'animated-flow-line' : ''}
              />
            );
          })}

          {/* Connectors: Food -> Subcategories */}
          {foodCat && subPositions.map(sub => {
            const isHovered = hoveredNode === sub.key || hoveredNode === foodCat.name;
            const dx = (sub.x - foodCat.x) * 0.45;
            const pathD = `M ${foodCat.x + 75} ${foodCat.y} C ${foodCat.x + 75 + dx} ${foodCat.y}, ${sub.x - 75 - dx} ${sub.y}, ${sub.x - 75} ${sub.y}`;

            return (
              <path
                key={`line-food-${sub.key}`}
                d={pathD}
                fill="none"
                stroke={isHovered ? sub.color : 'rgba(249, 115, 22, 0.3)'}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeDasharray="4 2"
              />
            );
          })}
        </svg>

        {/* DOM Node 1: Root Node (Total Spend) */}
        <div 
          className="flow-node flow-root-node"
          style={{ left: `${rootX}px`, top: `${rootY}px` }}
          onMouseEnter={() => setHoveredNode('root')}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={() => onSelectCategory('All Spending', categoryItems.flatMap(c => c.transactions), totalDebit)}
          title="Click to view all spending transactions"
        >
          <div className="flow-node-icon bg-indigo-500/20 text-indigo-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flow-node-content">
            <span className="flow-node-label">Total Outflow</span>
            <strong className="flow-node-amount text-rose-400">{formatCurrency(totalDebit)}</strong>
            <span className="flow-node-meta">100% of Expenses</span>
          </div>
        </div>

        {/* DOM Nodes 2: Category Nodes */}
        {catPositions.map(cat => {
          const percent = totalDebit > 0 ? Math.round((cat.amount / totalDebit) * 100) : 0;
          const color = getCategoryColor(cat.name, cat.isMax);

          return (
            <div
              key={cat.name}
              className={`flow-node flow-category-node ${cat.isMax ? 'node-max-traction' : ''}`}
              style={{ 
                left: `${cat.x}px`, 
                top: `${cat.y}px`,
                borderColor: cat.isMax ? '#ef4444' : (hoveredNode === cat.name ? color : undefined),
              }}
              onMouseEnter={() => setHoveredNode(cat.name)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectCategory(cat.name, cat.transactions, cat.amount)}
              title={cat.isMax ? `Maximum Traction Category: ${cat.name} - Click to view transactions` : `Click to view ${cat.name} transactions`}
            >
              {/* Max Traction Top Banner */}
              {cat.isMax && (
                <div className="max-traction-badge">
                  <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
                  <span>MAX TRACTION</span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <div 
                  className="flow-node-icon"
                  style={{ 
                    background: cat.isMax ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.07)',
                    borderColor: cat.isMax ? '#ef4444' : undefined,
                  }}
                >
                  {getCategoryIcon(cat.name, cat.isMax)}
                </div>

                <div className="flow-node-content">
                  <div className="flex items-center gap-1.5">
                    <span className={`flow-node-label ${cat.isMax ? 'text-rose-200 font-bold' : ''}`}>
                      {cat.name}
                    </span>
                    {cat.isFood && (
                      <span className="sub-count-chip">4 Sub</span>
                    )}
                  </div>

                  <strong 
                    className="flow-node-amount"
                    style={{ color: cat.isMax ? '#f87171' : '#f8fafc' }}
                  >
                    {formatCurrency(cat.amount)}
                  </strong>

                  <span className="flow-node-meta">
                    {percent}% of spend • {cat.transactions.length} txns
                  </span>
                </div>
              </div>

              <ExternalLink className="flow-node-link-icon w-3 h-3" />
            </div>
          );
        })}

        {/* DOM Nodes 3: Food Sub-Category Nodes */}
        {foodCat && subPositions.map(sub => {
          const subPct = totalFoodDebit > 0 ? Math.round((sub.amount / totalFoodDebit) * 100) : 0;

          return (
            <div
              key={sub.key}
              className="flow-node flow-sub-node"
              style={{ 
                left: `${sub.x}px`, 
                top: `${sub.y}px`,
                borderLeftColor: sub.color,
              }}
              onMouseEnter={() => setHoveredNode(sub.key)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectCategory(sub.label, sub.txs, sub.amount)}
              title={`Click to view ${sub.label} transactions`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="flow-sub-icon"
                  style={{ color: sub.color, background: `${sub.color}20` }}
                >
                  {sub.icon}
                </div>
                <div className="flow-node-content">
                  <span className="flow-sub-label">{sub.label}</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="flow-sub-amount">{formatCurrency(sub.amount)}</strong>
                    <span className="flow-sub-meta">({subPct}% of food)</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
