import React from 'react';
import type { StatementImportRecord } from '../types/statement.types';
import { formatDisplayDate } from '../utils/formatters';
import { FileText, Calendar, CheckCircle, Copy, ShieldCheck } from 'lucide-react';

interface ImportHistoryViewProps {
  history: StatementImportRecord[];
  isLoading?: boolean;
}

export const ImportHistoryView: React.FC<ImportHistoryViewProps> = ({ history, isLoading }) => {
  if (isLoading) {
    return (
      <div className="history-loading card-glass">
        <div className="spinner-lg" />
        <p>Loading statement import records...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-empty card-glass">
        <FileText className="w-12 h-12 text-slate-500 mb-3" />
        <h4>No statement import history yet</h4>
        <p className="text-slate-400 text-sm">
          When you import PDF statements, records of transactions imported, duplicates detected, and timestamps will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="import-history-container">
      <div className="history-header">
        <div>
          <h3 className="section-title">Statement Import History</h3>
          <p className="section-subtitle">
            Audit trail of imported statements. Statements are processed client-side and original PDFs are discarded for privacy.
          </p>
        </div>
        <div className="privacy-badge">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1" />
          <span>Zero PDF Retention Policy</span>
        </div>
      </div>

      <div className="table-responsive-wrapper card-glass">
        <table className="history-table">
          <thead>
            <tr>
              <th>File / Source Name</th>
              <th>Source Format</th>
              <th>Import Date & Time</th>
              <th>Found</th>
              <th>Duplicates</th>
              <th>Imported</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map(record => {
              const formattedDate = formatDisplayDate(record.importedAt.split('T')[0]);
              const time = new Date(record.importedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <tr key={record.id} className="history-row">
                  <td className="td-file">
                    <div className="file-info-cell">
                      <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="file-name" title={record.fileName}>{record.fileName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="source-tag">{record.sourceType}</span>
                  </td>
                  <td>
                    <div className="date-time-cell">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1 inline" />
                      <span>{formattedDate}</span>
                      <span className="time-sub">{time}</span>
                    </div>
                  </td>
                  <td>
                    <span className="stat-num">{record.totalTransactionsFound}</span>
                  </td>
                  <td>
                    {record.duplicateCount > 0 ? (
                      <span className="stat-duplicate">
                        <Copy className="w-3 h-3 mr-1 inline" />
                        {record.duplicateCount}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td>
                    <span className="stat-imported">
                      <CheckCircle className="w-3 h-3 mr-1 inline text-emerald-400" />
                      {record.importedCount}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${record.status === 'Completed' ? 'status-completed' : 'status-partial'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
