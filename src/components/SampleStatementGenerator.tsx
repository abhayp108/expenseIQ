import React, { useState } from 'react';
import { Download, FileText, Lock, Sparkles, Check } from 'lucide-react';

export const SampleStatementGenerator: React.FC = () => {
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const downloadFile = (path: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(fileName);
    setTimeout(() => setDownloaded(null), 3500);
  };

  return (
    <div className="sample-generator-card card-glass">
      <div className="sample-generator-header">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h4 className="text-base font-semibold text-slate-100">Test Statements Library</h4>
        </div>
        <span className="badge badge-subtle">Ready to Test</span>
      </div>
      <p className="text-sm text-slate-400 mb-3">
        Download sample statements to test the import workflow, auto-categorization (Swiggy, HPCL, Amazon, Netflix), duplicate detection, and password unlocking.
      </p>

      <div className="sample-buttons-grid">
        <button
          type="button"
          className="sample-btn"
          onClick={() => downloadFile('/sample-statements/sample_phonepe_statement.pdf', 'PhonePe_Sept_Statement.pdf')}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <div className="sample-btn-text">
            <strong>PhonePe Statement</strong>
            <span>Swiggy, HPCL, Amazon, Netflix</span>
          </div>
          {downloaded === 'PhonePe_Sept_Statement.pdf' ? (
            <Check className="w-4 h-4 text-emerald-400 ml-auto" />
          ) : (
            <Download className="w-4 h-4 text-slate-400 ml-auto" />
          )}
        </button>

        <button
          type="button"
          className="sample-btn sample-btn-protected"
          onClick={() => downloadFile('/sample-statements/sample_bank_statement_protected.pdf', 'HDFC_Protected_Statement.pdf')}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <div className="sample-btn-text">
            <strong>Password-Protected Statement</strong>
            <span className="text-amber-300">Password: statement123</span>
          </div>
          {downloaded === 'HDFC_Protected_Statement.pdf' ? (
            <Check className="w-4 h-4 text-emerald-400 ml-auto" />
          ) : (
            <Download className="w-4 h-4 text-slate-400 ml-auto" />
          )}
        </button>
      </div>
    </div>
  );
};
