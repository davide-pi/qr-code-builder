// Normalize a user-typed amount: accepts a comma or a dot as decimal separator.
// Returns a plain decimal string ("10.50") or null when it is not a number > 0
// or has more than `maxDecimals` decimals.
export function normalizeAmount(value: string, maxDecimals: number): string | null {
  const match = /^(\d*)(?:\.(\d*))?$/.exec(value.trim().replace(',', '.'));
  if (!match || (!match[1] && !match[2])) return null;
  const integer = match[1] || '0';
  const fraction = match[2] ?? '';
  if (fraction.length > maxDecimals) return null;
  if (!(Number(`${integer}.${fraction || '0'}`) > 0)) return null;
  return fraction ? `${integer}.${fraction}` : integer;
}
