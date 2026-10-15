// Pure E.164 builder. It deliberately does not use libphonenumber-js: that library is ~126 kB
// and lives only in the lazy CountryCodeSelect chunk (the country list).

// E.164 allows at most 15 digits; below 5 there is no real phone number
const isPlausible = (digits: string): boolean => digits.length >= 5 && digits.length <= 15;

// National trunk prefix: the digit(s) dialled before a domestic number that E.164 drops
// ("07911 123456" in the UK is +44 7911 123456). Keyed by calling code (no "+").
// Only countries where the prefix is certain are listed. Spain, Portugal, Greece, Poland,
// the Czech Republic, Scandinavia (except SE/FI), Mexico... have no trunk prefix, and
// ITALY (+39) / San Marino / Vatican KEEP the leading 0 of landlines: they are not listed.
interface TrunkRule {
  prefix: string;
  // For prefixes that are also a legal first digit of a number (NANP "1", RU "8"): strip
  // only when the rest has exactly this many digits
  nsnLength?: number;
}

const ZERO_TRUNK_CODES = [
  '44', '49', '33', '31', '32', '43', '41', '353', '46', '358', '421', '40', '359', '385', '386',
  '381', '380', '90', '972', '61', '64', '81', '82', '86', '91', '27', '55', '54', '20', '212',
  '234', '254', '66', '84', '62', '60', '63', '92', '98', '971', '966',
];

const TRUNK_RULES: Record<string, TrunkRule> = {
  ...Object.fromEntries(ZERO_TRUNK_CODES.map((code): [string, TrunkRule] => [code, { prefix: '0' }])),
  '36': { prefix: '06' }, // Hungary
  '1': { prefix: '1', nsnLength: 10 }, // NANP: US, Canada, Caribbean
  '7': { prefix: '8', nsnLength: 10 }, // Russia, Kazakhstan
};

// Drops the trunk prefix of a national number, when the country has one
const stripTrunkPrefix = (callingCode: string, national: string): string => {
  const rule = TRUNK_RULES[callingCode];
  if (!rule || !national.startsWith(rule.prefix)) return national;
  const rest = national.slice(rule.prefix.length);
  return rule.nsnLength === undefined || rest.length === rule.nsnLength ? rest : national;
};

// "+44 (0) 7911 123456": a written "(0)" after the calling code is the trunk prefix, not part
// of the number. Calling codes are prefix-free, so the first match is the right one.
const stripInternationalTrunkZero = (digits: string): string => {
  for (const length of [1, 2, 3]) {
    const callingCode = digits.slice(0, length);
    if (TRUNK_RULES[callingCode]?.prefix === '0') {
      const national = digits.slice(length);
      return national.startsWith('0') ? callingCode + national.slice(1) : digits;
    }
  }
  return digits;
};

// Build the full international number ("+39612345678") from the selected calling code
// ("+39") and what the user typed. A number typed with "+" or "00" is already international
// and the calling code is ignored. Returns null when no plausible number can be built.
export function toE164(callingCode: string, input: string): string | null {
  const typed = input.trim();
  const digits = typed.replace(/\D/g, '');
  if (!digits) return null;

  if (typed.startsWith('+') || typed.startsWith('00')) {
    const international = stripInternationalTrunkZero(typed.startsWith('+') ? digits : digits.slice(2));
    return isPlausible(international) ? `+${international}` : null;
  }

  const code = callingCode.replace(/\D/g, '');
  const full = `${code}${stripTrunkPrefix(code, digits)}`;
  return isPlausible(full) ? `+${full}` : null;
}
