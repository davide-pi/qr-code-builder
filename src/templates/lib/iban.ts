export const normalizeIban = (value: string): string => value.replace(/\s+/g, '').toUpperCase();

// Structure check plus the ISO 13616 mod-97 checksum
export function isValidIban(value: string): boolean {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    // Letters map to 10..35 (two digits), digits stay one digit
    const code = char >= 'A' ? char.charCodeAt(0) - 55 : Number(char);
    remainder = (remainder * (code > 9 ? 100 : 10) + code) % 97;
  }
  return remainder === 1;
}

export const isValidBic = (value: string): boolean =>
  /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.replace(/\s+/g, '').toUpperCase());
