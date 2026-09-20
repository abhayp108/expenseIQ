import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import type { ParsedTransaction } from '../types/statement.types';
import type { Transaction } from '../../../types/expense.types';
import { 
  extractPdfContent, 
  isPdfPasswordProtected, 
  InvalidPasswordError, 
  PasswordRequiredError 
} from '../services/pdfExtractor';
import { StatementParserRegistry } from '../parsers/statementDetector';
import { detectDuplicates } from '../services/duplicateDetector';
import { saveImportedTransactions } from '../services/statementImportService';
import { PasswordPromptModal } from './PasswordPromptModal';
import { ImportSummaryCard } from './ImportSummaryCard';
import { TransactionPreviewTable } from './TransactionPreviewTable';

interface StatementImportModalProps {
  userId: string;
  existingTransactions: Transaction[];
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

type Step = 'upload' | 'preview' | 'completed';

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  userId,
  existingTransactions,
  onClose,
  onImportComplete,
}) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Extracted transactions & duplicates
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [totalFoundCount, setTotalFoundCount] = useState(0);
  const [detectedFormat, setDetectedFormat] = useState('Generic Statement');
  const [filter, setFilter] = useState<'all' | 'new' | 'duplicates'>('all');

  // Confirmation state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle File Selection
  const handleFileChange = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setGeneralError('Please select a valid PDF statement file.');
      return;
    }

    setSelectedFile(file);
    setGeneralError(null);
    setPasswordError(null);
    setIsLoading(true);
    setLoadingStatus('Analyzing PDF security & structure...');

    try {
      // Step 2: Check if PDF is password protected
      const isProtected = await isPdfPasswordProtected(file);
      if (isProtected) {
        setIsLoading(false);
        setShowPasswordModal(true);
        return;
      }

      // Step 6 & 7: Parse & Extract unprotected PDF
      await processPdf(file);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof PasswordRequiredError) {
        setShowPasswordModal(true);
      } else {
        setGeneralError(`Could not read PDF: ${(err as Error).message || 'Unknown error'}`);
      }
    }
  };

  // Raw text inspection state
  const [rawExtractedText, setRawExtractedText] = useState('');
  const [cachedPagesText, setCachedPagesText] = useState<string[]>([]);
  const [showRawTextModal, setShowRawTextModal] = useState(false);

  // 2. Process & Parse PDF with optional password
  const processPdf = async (file: File, password?: string) => {
    setIsLoading(true);
    setLoadingStatus('Decrypting & reading statement text securely...');

    try {
      // Extract client-side
      const extraction = await extractPdfContent(file, password);
      setRawExtractedText(extraction.fullText);
      setCachedPagesText(extraction.pagesText);
      setLoadingStatus('Detecting statement format & extracting transactions...');

      // Auto-detect parser
      let parser = StatementParserRegistry.detectParser(extraction.fullText, file.name);
      let parseResult = parser.parse(extraction.fullText, extraction.pagesText);

      // If detected parser extracted 0, cascade through other parsers
      if (parseResult.transactions.length === 0) {
        const allParsers = StatementParserRegistry.getAvailableParsers();
        for (const altParser of allParsers) {
          if (altParser.name === parser.name) continue;
          const altResult = altParser.parse(extraction.fullText, extraction.pagesText);
          if (altResult.transactions.length > 0) {
            parser = altParser;
            parseResult = altResult;
            break;
          }
        }
      }

      setDetectedFormat(parser.sourceType);

      if (parseResult.transactions.length === 0) {
        setGeneralError(
          `Could not identify transaction rows using standard ${parser.sourceType} templates. Click "View Raw Text" below to inspect the extracted lines or share a sample with us to tune the parser.`
        );
        setIsLoading(false);
        return;
      }

      // Duplicate Detection
      setLoadingStatus('Checking against existing transactions for duplicates...');
      const dedupeResult = detectDuplicates(parseResult.transactions, existingTransactions);

      setTotalFoundCount(dedupeResult.totalCount);
      setDuplicateCount(dedupeResult.duplicateCount);
      setParsedTransactions(dedupeResult.transactions);

      // Close password modal if open, clear password from memory immediately
      setShowPasswordModal(false);
      setPasswordError(null);
      setIsLoading(false);
      setCurrentStep('preview');
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof InvalidPasswordError) {
        setPasswordError('The password entered was incorrect. Please try again.');
        setShowPasswordModal(true);
      } else if (err instanceof PasswordRequiredError) {
        setShowPasswordModal(true);
      } else {
        setGeneralError(`Error processing statement: ${(err as Error).message || 'Unknown error'}`);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  // Re-run parsing with manually selected parser
  const handleSwitchParser = (parserType: string) => {
    if (!rawExtractedText) return;
    const parser = StatementParserRegistry.getParserByName(parserType) || 
                   StatementParserRegistry.getAvailableParsers().find(p => p.sourceType === parserType);
    if (!parser) return;

    setDetectedFormat(parser.sourceType);
    const result = parser.parse(rawExtractedText, cachedPagesText);
    const dedupe = detectDuplicates(result.transactions, existingTransactions);

    setTotalFoundCount(dedupe.totalCount);
    setDuplicateCount(dedupe.duplicateCount);
    setParsedTransactions(dedupe.transactions);
  };

  // 3. Password modal unlock submission
  const handleUnlockWithPassword = async (password: string) => {
    if (!selectedFile) return;
    setIsUnlocking(true);
    setPasswordError(null);
    await processPdf(selectedFile, password);
  };

  // 4. Preview table manipulations
  const handleToggleSelect = (id: string) => {
    setParsedTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, isSelected: !tx.isSelected } : tx))
    );
  };

  const handleUpdateTransaction = (id: string, updated: Partial<ParsedTransaction>) => {
    setParsedTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, ...updated } : tx))
    );
  };

  const handleIgnoreTransaction = (id: string) => {
    setParsedTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, isIgnored: true, isSelected: false } : tx))
    );
  };

  const handleRestoreTransaction = (id: string) => {
    setParsedTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, isIgnored: false, isSelected: true } : tx))
    );
  };

  // Selection actions
  const handleSelectAll = () => {
    setParsedTransactions(prev =>
      prev.map(tx => (tx.isIgnored ? tx : { ...tx, isSelected: true }))
    );
  };

  const handleSelectNewOnly = () => {
    setParsedTransactions(prev =>
      prev.map(tx => (tx.isIgnored ? tx : { ...tx, isSelected: !tx.isDuplicate }))
    );
  };

  const handleDeselectAll = () => {
    setParsedTransactions(prev => prev.map(tx => ({ ...tx, isSelected: false })));
  };

  // Filter transactions for preview
  const filteredTransactions = parsedTransactions.filter(tx => {
    if (filter === 'new') return !tx.isDuplicate;
    if (filter === 'duplicates') return tx.isDuplicate;
    return true;
  });

  const selectedCount = parsedTransactions.filter(tx => tx.isSelected && !tx.isIgnored).length;

  // 5. Confirm and Save to Firestore
  const handleConfirmImport = async () => {
    if (!selectedFile || selectedCount === 0) return;
    setIsSaving(true);

    try {
      const selectedTxs = parsedTransactions.filter(tx => tx.isSelected && !tx.isIgnored);
      const result = await saveImportedTransactions(
        userId,
        selectedFile.name,
        detectedFormat,
        totalFoundCount,
        duplicateCount,
        selectedTxs
      );

      setShowConfirmDialog(false);
      setIsSaving(false);
      setCurrentStep('completed');
      onImportComplete(result.importedCount);
    } catch (err) {
      setIsSaving(false);
      alert(`Import failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="import-wizard-modal card-glass">
        {/* Modal Top Header */}
        <div className="wizard-header">
          <div className="wizard-title-group">
            <div className="wizard-icon-bubble">
              <UploadCloud className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="wizard-title">Import Statement (PDF)</h2>
              <p className="wizard-subtitle">
                Extract transactions client-side from PhonePe, Google Pay, Bank statements & generic PDFs
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        <div className="wizard-steps-bar">
          <div className={`wizard-step-item ${currentStep === 'upload' ? 'active' : 'completed'}`}>
            <span className="step-num">1</span>
            <span className="step-label">Select File</span>
          </div>
          <div className="step-line" />
          <div className={`wizard-step-item ${currentStep === 'preview' ? 'active' : currentStep === 'completed' ? 'completed' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">Review & Edit</span>
          </div>
          <div className="step-line" />
          <div className={`wizard-step-item ${currentStep === 'completed' ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Confirmed</span>
          </div>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="wizard-error-banner">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div className="flex-1">
              <span>{generalError}</span>
              {rawExtractedText && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-xs"
                    onClick={() => setShowRawTextModal(true)}
                  >
                    🔍 View Extracted PDF Text ({rawExtractedText.split('\n').length} lines)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Upload View */}
        {currentStep === 'upload' && (
          <div className="upload-view-content">
            <div
              className={`dropzone card-glass ${isLoading ? 'loading' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {isLoading ? (
                <div className="dropzone-loading">
                  <div className="spinner-lg" />
                  <h4>Processing Statement</h4>
                  <p>{loadingStatus}</p>
                </div>
              ) : (
                <div className="dropzone-idle">
                  <div className="dropzone-icon-box">
                    <FileText className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h4>Choose a PDF statement to import</h4>
                  <p className="dropzone-hint">
                    Drag and drop your file here, or <span className="text-highlight">browse files</span>
                  </p>
                  <div className="supported-formats-pills">
                    <span>PhonePe Statements</span>
                    <span>Google Pay</span>
                    <span>Bank Statements (HDFC, SBI, ICICI, Axis, etc.)</span>
                    <span>Password-Protected PDFs</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Tuning Callout */}
            <div className="custom-statement-tip card-glass">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h5 className="font-semibold text-slate-200 text-sm">Have a unique or unsupported statement format?</h5>
              </div>
              <p className="text-xs text-slate-400">
                You can copy your statement file into the project root at <code className="text-indigo-300">d:/Projects/expenseIQ/</code> or share a few sample lines in chat, and we will inspect the exact structure and build a dedicated parser for your bank!
              </p>
            </div>

            {/* Privacy & Security Guarantees */}
            <div className="privacy-card card-glass">
              <div className="privacy-card-header">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mr-2" />
                <h4>Bank-Grade Privacy & Client-Side Processing</h4>
              </div>
              <ul className="privacy-list">
                <li>Statements are parsed <strong>100% locally in your browser</strong>.</li>
                <li>PDF passwords are used only in volatile memory to unlock the document and are <strong>never stored or logged</strong>.</li>
                <li>Original PDF files are <strong>not stored</strong> on any server.</li>
                <li>Only the transactions you review and confirm are written to your private Firestore database.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Edit View */}
        {currentStep === 'preview' && (
          <div className="preview-view-content">
            <div className="preview-header-bar">
              <div className="file-format-badge-group">
                <span className="file-badge">
                  <FileText className="w-3.5 h-3.5 mr-1 inline text-indigo-400" />
                  {selectedFile?.name}
                </span>
                
                {/* Manual Parser Switcher */}
                <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md border border-white/10">
                  <span className="text-xs text-slate-400 font-medium">Format:</span>
                  <select
                    className="bg-transparent text-xs text-indigo-300 font-semibold border-none outline-none cursor-pointer"
                    value={detectedFormat}
                    onChange={(e) => handleSwitchParser(e.target.value)}
                  >
                    <option value="PhonePe" className="bg-slate-900 text-white">PhonePe</option>
                    <option value="Google Pay" className="bg-slate-900 text-white">Google Pay</option>
                    <option value="Bank Account" className="bg-slate-900 text-white">Bank Statement</option>
                    <option value="Financial Statement" className="bg-slate-900 text-white">Generic Statement</option>
                  </select>
                </div>

                {rawExtractedText && (
                  <button
                    type="button"
                    className="action-text-btn text-xs text-indigo-400 hover:text-indigo-300 ml-2"
                    onClick={() => setShowRawTextModal(true)}
                  >
                    🔍 View Raw Text
                  </button>
                )}
              </div>
              <p className="preview-instructions">
                Review and edit transactions below. Only checked items will be imported.
              </p>
            </div>

            {/* Summary Chips and Filter Pill bar */}
            <ImportSummaryCard
              totalFound={totalFoundCount}
              duplicateCount={duplicateCount}
              selectedCount={selectedCount}
              filter={filter}
              onFilterChange={setFilter}
              onSelectAll={handleSelectAll}
              onSelectNewOnly={handleSelectNewOnly}
              onDeselectAll={handleDeselectAll}
            />

            {/* Preview Table */}
            <TransactionPreviewTable
              transactions={filteredTransactions}
              onToggleSelect={handleToggleSelect}
              onUpdateTransaction={handleUpdateTransaction}
              onIgnoreTransaction={handleIgnoreTransaction}
              onRestoreTransaction={handleRestoreTransaction}
            />

            {/* Bottom Actions */}
            <div className="wizard-bottom-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCurrentStep('upload');
                  setSelectedFile(null);
                  setParsedTransactions([]);
                }}
              >
                Back / Change File
              </button>

              <button
                type="button"
                className="btn btn-primary btn-glow"
                disabled={selectedCount === 0}
                onClick={() => setShowConfirmDialog(true)}
              >
                Import Selected ({selectedCount}) <ArrowRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Completed View */}
        {currentStep === 'completed' && (
          <div className="completed-view-content card-glass">
            <div className="completed-icon-wrapper">
              <CheckCircle className="w-16 h-16 text-emerald-400" />
            </div>
            <h3>Transactions Imported Successfully!</h3>
            <p className="completed-text">
              <strong>{selectedCount} transactions</strong> from <em>{selectedFile?.name}</em> have been saved to your account.
            </p>
            <div className="completed-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCurrentStep('upload');
                  setSelectedFile(null);
                  setParsedTransactions([]);
                }}
              >
                Import Another Statement
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                View Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Password Prompt Modal if PDF is encrypted */}
        {showPasswordModal && selectedFile && (
          <PasswordPromptModal
            fileName={selectedFile.name}
            errorMessage={passwordError}
            isLoading={isUnlocking}
            onUnlock={handleUnlockWithPassword}
            onCancel={() => {
              setShowPasswordModal(false);
              setSelectedFile(null);
              setIsLoading(false);
              setPasswordError(null);
            }}
          />
        )}

        {/* Confirmation Modal before Firestore write */}
        {showConfirmDialog && (
          <div className="modal-backdrop confirmation-backdrop">
            <div className="confirm-modal card-glass">
              <div className="confirm-icon-wrapper">
                <HelpCircle className="w-8 h-8 text-indigo-400" />
              </div>
              <h3>Confirm Statement Import</h3>
              <p>
                You are about to import <strong>{selectedCount} transactions</strong> from{' '}
                <em>{selectedFile?.name}</em>.
              </p>
              {duplicateCount > 0 && (
                <p className="text-amber-400 text-sm mt-2">
                  Note: Any selected duplicate transactions will be imported alongside your existing records.
                </p>
              )}
              <div className="modal-actions mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-glow"
                  onClick={handleConfirmImport}
                  disabled={isSaving}
                >
                  {isSaving ? 'Importing...' : 'Yes, Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Raw Text Inspector Modal */}
        {showRawTextModal && (
          <div className="modal-backdrop raw-text-backdrop">
            <div className="raw-text-modal card-glass">
              <div className="modal-header">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h4>Extracted Statement Text ({selectedFile?.name})</h4>
                </div>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setShowRawTextModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                This is the raw spatial text extracted directly in your browser. You can copy it to share for parser customization:
              </p>
              <textarea
                readOnly
                className="raw-text-area"
                value={rawExtractedText}
              />
              <div className="modal-actions mt-3">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(rawExtractedText);
                    alert('Copied extracted text to clipboard!');
                  }}
                >
                  Copy Text to Clipboard
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowRawTextModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
