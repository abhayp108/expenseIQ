import React from 'react';
import { Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ImportSummaryCardProps {
  totalFound: number;
  duplicateCount: number;
  selectedCount: number;
  filter: 'all' | 'new' | 'duplicates';
  onFilterChange: (filter: 'all' | 'new' | 'duplicates') => void;
  onSelectAll: () => void;
  onSelectNewOnly: () => void;
  onDeselectAll: () => void;
}

export const ImportSummaryCard: React.FC<ImportSummaryCardProps> = ({
  totalFound,
  duplicateCount,
  selectedCount,
  filter,
  onFilterChange,
  onSelectAll,
  onSelectNewOnly,
  onDeselectAll,
}) => {
  const newCount = totalFound - duplicateCount;

  return (
    <div className="import-summary-bar card-glass">
      <div className="summary-stats-group">
        <div className="summary-stat-chip">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="chip-label">Found:</span>
          <strong>{totalFound} transactions found</strong>
        </div>

        {duplicateCount > 0 && (
          <div className="summary-stat-chip chip-warning">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="chip-label">Duplicates:</span>
            <strong>{duplicateCount} possible duplicates</strong>
          </div>
        )}

        <div className="summary-stat-chip chip-success">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="chip-label">Selected:</span>
          <strong>{selectedCount} ready to import</strong>
        </div>
      </div>

      <div className="summary-controls-group">
        {/* Filter Tabs */}
        <div className="filter-pill-group">
          <button
            type="button"
            className={`pill-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All ({totalFound})
          </button>
          <button
            type="button"
            className={`pill-btn ${filter === 'new' ? 'active' : ''}`}
            onClick={() => onFilterChange('new')}
          >
            New ({newCount})
          </button>
          {duplicateCount > 0 && (
            <button
              type="button"
              className={`pill-btn pill-warning ${filter === 'duplicates' ? 'active' : ''}`}
              onClick={() => onFilterChange('duplicates')}
            >
              Duplicates ({duplicateCount})
            </button>
          )}
        </div>

        {/* Quick Selection Actions */}
        <div className="selection-quick-actions">
          <button type="button" className="action-text-btn" onClick={onSelectNewOnly}>
            Select New
          </button>
          <span className="divider-dot">•</span>
          <button type="button" className="action-text-btn" onClick={onSelectAll}>
            Select All
          </button>
          <span className="divider-dot">•</span>
          <button type="button" className="action-text-btn" onClick={onDeselectAll}>
            Deselect All
          </button>
        </div>
      </div>
    </div>
  );
};
