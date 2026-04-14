/** Matches the first decimal number (positive or negative) in a string. */
export const NUMERIC_RE = /-?\d+(?:\.\d+)?/;

/**
 * Extracts the first numeric value from a string.
 * Returns `null` if no number is found.
 */
export function parseFirstNumber(value: string): number | null {
  const match = value.match(NUMERIC_RE);
  return match ? Number(match[0]) : null;
}
