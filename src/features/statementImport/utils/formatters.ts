/**
 * Formatting utilities for transactions, dates, and amounts.
 */

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
};

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

/**
 * Standardizes multiple date formats into YYYY-MM-DD:
 * - 18 Sep 2026 or 18-Sep-2026
 * - Sep 18, 2026
 * - 18/09/2026 or 18-09-2026
 * - 2026-09-18
 */
export const normalizeToIsoDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  const clean = dateStr.trim().replace(/,/g, '');

  // Match ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Match 18/09/2026 or 18-09-2026 or 18.09.2026 (DD/MM/YYYY)
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Match 18 Sep 2026 or 18-Sep-2026
  const dayMonthYearMatch = clean.match(/^(\d{1,2})[\s-]+([A-Za-z]+)[\s-]+(\d{2,4})$/);
  if (dayMonthYearMatch) {
    const day = dayMonthYearMatch[1].padStart(2, '0');
    const monthStr = dayMonthYearMatch[2].toLowerCase();
    const month = MONTH_MAP[monthStr] || '01';
    let year = dayMonthYearMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Match Sep 18 2026
  const monthDayYearMatch = clean.match(/^([A-Za-z]+)[\s-]+(\d{1,2})[\s-]+(\d{2,4})$/);
  if (monthDayYearMatch) {
    const monthStr = monthDayYearMatch[1].toLowerCase();
    const month = MONTH_MAP[monthStr] || '01';
    const day = monthDayYearMatch[2].padStart(2, '0');
    let year = monthDayYearMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Fallback to Date parser
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
};

export const formatDisplayDate = (isoDate: string): string => {
  try {
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) return isoDate;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  } catch {
    return isoDate;
  }
};
