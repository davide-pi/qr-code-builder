import { parsePhoneNumberFromString } from 'libphonenumber-js';

// E.164 allows at most 15 digits; below 5 there is no real phone number
const isPlausible = (digits: string): boolean => digits.length >= 5 && digits.length <= 15;

// Build the full international number ("+39612345678") from the selected country code and
// what the user typed. A number typed with "+" or "00" is already international and the
// country code is ignored. Returns null when no plausible number can be built.
export function toE164(countryCode: string, input: string): string | null {
  const typed = input.trim();
  const digits = typed.replace(/\D/g, '');
  if (!digits) return null;

  if (typed.startsWith('+') || typed.startsWith('00')) {
    const international = typed.startsWith('+') ? digits : digits.slice(2);
    const parsed = parsePhoneNumberFromString(`+${international}`);
    if (parsed?.isPossible()) return parsed.number;
    return isPlausible(international) ? `+${international}` : null;
  }

  const callingCode = countryCode.replace(/\D/g, '');
  // libphonenumber drops the national trunk prefix (the leading 0 of UK/DE/FR numbers…)
  // only where the country uses one: Italian numbers keep it
  const parsed = parsePhoneNumberFromString(digits, { defaultCallingCode: callingCode });
  if (parsed?.isPossible()) return parsed.number;
  return isPlausible(`${callingCode}${digits}`) ? `+${callingCode}${digits}` : null;
}
