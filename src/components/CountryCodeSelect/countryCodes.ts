import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

export interface CountryCodeEntry {
  countryCode: CountryCode;
  code: string;
  country: string;
}

// Priority countries to show at the top of the list
const priorityCountries: CountryCode[] = ['IT', 'US', 'GB', 'DE', 'FR', 'ES'];

const getRegionNames = (locale: string): Intl.DisplayNames | null => {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    return null;
  }
};

// Dialing codes with country names localised in `locale` (generated from libphonenumber-js)
export const buildCountryCodes = (locale: string): CountryCodeEntry[] => {
  const regionNames = getRegionNames(locale);
  const all = getCountries()
    .map((countryCode) => ({
      countryCode,
      code: `+${getCountryCallingCode(countryCode)}`,
      country: regionNames?.of(countryCode) || countryCode,
    }))
    .sort((a, b) => a.country.localeCompare(b.country, locale));

  // Priority countries first, then the rest alphabetically
  const priority = priorityCountries
    .map((cc) => all.find((c) => c.countryCode === cc))
    .filter((c): c is CountryCodeEntry => c !== undefined);
  return [...priority, ...all.filter((c) => !priorityCountries.includes(c.countryCode))];
};
