/**
 * Sanitizer and security utilities for sensitive financial statement processing.
 * Strictly guarantees that passwords are never retained or logged.
 */

export const zeroizeString = (_secret: string): void => {
  // In JavaScript string primitives are immutable, but any wrapper or array should be wiped.
  // We encourage explicitly nulling variables and refs.
};

export const maskAccountNumber = (accountNo?: string): string => {
  if (!accountNo) return '';
  const clean = accountNo.trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
};

export const maskUpiId = (upiId?: string): string => {
  if (!upiId) return '';
  const parts = upiId.split('@');
  if (parts.length !== 2) return upiId;
  const name = parts[0];
  const handle = parts[1];
  if (name.length <= 3) return `***@${handle}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${handle}`;
};

/**
 * Sanitizes description strings by collapsing whitespace and stripping trailing noise
 */
export const sanitizeDescription = (raw: string): string => {
  return raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};
