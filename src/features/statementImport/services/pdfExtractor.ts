import * as pdfjsLib from 'pdfjs-dist';
import type { PDFExtractionResult } from '../types/statement.types';

// Setup pdfjs worker
try {
  // Try Vite asset URL bundling
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
} catch {
  // Fallback to official cdn matching the installed version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
}

export interface ExtractOptions {
  password?: string;
  onPasswordRequired?: () => Promise<string>;
}

export class PasswordRequiredError extends Error {
  constructor(message: string = 'Password is required to open this PDF.') {
    super(message);
    this.name = 'PasswordRequiredError';
  }
}

export class InvalidPasswordError extends Error {
  constructor(message: string = 'The provided password was incorrect. Please try again.') {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

/**
 * Checks if a PDF file is password protected without attempting full extraction.
 */
export const isPdfPasswordProtected = async (file: File): Promise<boolean> => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      password: '',
    });

    await loadingTask.promise;
    return false;
  } catch (err: unknown) {
    const error = err as { name?: string; code?: number };
    if (error?.name === 'PasswordException') {
      return true;
    }
    return false;
  }
};

/**
 * Extracts all textual content from a PDF file using pdfjs-dist.
 * Safely processes password-protected PDFs strictly client-side in memory.
 * Never persists or logs the password.
 */
export const extractPdfContent = async (
  file: File,
  password?: string
): Promise<PDFExtractionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  let doc: pdfjsLib.PDFDocumentProxy;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data,
      password: password || '',
    });

    doc = await loadingTask.promise;
  } catch (err: unknown) {
    const error = err as { name?: string; code?: number };
    if (error?.name === 'PasswordException') {
      // Code 1: NEED_PASSWORD, Code 2: INCORRECT_PASSWORD
      if (password) {
        throw new InvalidPasswordError();
      } else {
        throw new PasswordRequiredError();
      }
    }
    throw new Error(`Failed to read PDF document: ${(err as Error).message || 'Unknown error'}`);
  }

  const pageCount = doc.numPages;
  const pagesText: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Collect text items with spatial coordinates
    interface SpatialItem {
      str: string;
      x: number;
      y: number;
      width: number;
    }

    const rawItems = (textContent.items as Array<{
      str?: string;
      transform?: number[];
      width?: number;
    }>)
      .filter(item => item.str && item.str.trim() !== '')
      .map(item => ({
        str: item.str!,
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? item.transform[5] : 0,
        width: item.width || 0,
      }));

    // Cluster items into visual horizontal lines (items within 4px Y of each other)
    interface TextLine {
      y: number;
      items: SpatialItem[];
    }

    const lines: TextLine[] = [];
    const Y_TOLERANCE = 4.0;

    for (const item of rawItems) {
      // Find matching line cluster
      let matchedLine = lines.find(l => Math.abs(l.y - item.y) <= Y_TOLERANCE);
      if (!matchedLine) {
        matchedLine = { y: item.y, items: [] };
        lines.push(matchedLine);
      }
      matchedLine.items.push(item);
    }

    // Sort lines top to bottom (Y descending)
    lines.sort((a, b) => b.y - a.y);

    const pageLines: string[] = [];

    for (const line of lines) {
      // Sort items within each line left to right (X ascending)
      line.items.sort((a, b) => a.x - b.x);

      // Join items with intelligent spacing
      let lineText = '';
      for (let idx = 0; idx < line.items.length; idx++) {
        const curr = line.items[idx];
        if (idx === 0) {
          lineText = curr.str;
        } else {
          const prev = line.items[idx - 1];
          const gap = curr.x - (prev.x + prev.width);
          // If significant gap between columns, use wide spacing, otherwise single space
          if (gap > 12) {
            lineText += '   ' + curr.str;
          } else if (gap > 2 || (!lineText.endsWith(' ') && !curr.str.startsWith(' '))) {
            lineText += ' ' + curr.str;
          } else {
            lineText += curr.str;
          }
        }
      }

      if (lineText.trim()) {
        pageLines.push(lineText.trim());
      }
    }

    pagesText.push(pageLines.join('\n'));
  }

  const fullText = pagesText.join('\n\n--- PAGE BREAK ---\n\n');

  // Check if PDF has no extractable text layer (scanned/raster image)
  const totalCharacters = fullText.replace(/[\s\r\n\t]+/g, '').length;
  if (totalCharacters < 15 && pageCount > 0) {
    throw new Error(
      'This PDF appears to be a scanned image or photo without selectable text. Please provide an original electronic PDF statement from your bank or payment app.'
    );
  }

  return {
    isPasswordProtected: Boolean(password),
    pagesText,
    fullText,
    pageCount,
    fileName: file.name,
  };
};
