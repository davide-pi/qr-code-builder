// Resolution of a profile handle, or of a pasted profile URL, to a canonical profile URL

export interface SocialUrlConfig {
  // Canonical URL prefix, e.g. 'https://instagram.com/'
  baseUrl: string;
  // Hosts (without "www.") whose pasted URLs are recognised as this network
  hosts: string[];
  // Prefix glued to a bare handle in the canonical URL, e.g. '@' for TikTok and YouTube
  handlePrefix?: string;
  // Path segments that introduce a handle ('in' | 'company' for LinkedIn…)
  kinds?: string[];
  // Kind used when the user typed a bare handle
  defaultKind?: string;
  // First path segments that are not handles: the pasted URL is used as is (Facebook profile.php?id=…)
  passthrough?: string[];
  // Encoder of the handle (defaults to encodeURIComponent)
  encode?: (handle: string) => string;
}

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;

const stripHostPrefix = (host: string): string => host.toLowerCase().replace(/^(www|m|mobile)\./, '');

function buildFromSegments(config: SocialUrlConfig, segments: string[]): string | null {
  const kinds = config.kinds ?? [];
  let kind = config.defaultKind;
  let rest = segments;
  if (segments.length >= 2 && kinds.includes(segments[0].toLowerCase())) {
    kind = segments[0].toLowerCase();
    rest = segments.slice(1);
  }
  let handle: string;
  try {
    handle = decodeURIComponent(rest[0] ?? '').replace(/^@+/, '').trim();
  } catch {
    return null;
  }
  if (!handle) return null;
  const encode = config.encode ?? encodeURIComponent;
  // An explicit kind from the user ('company/acme') replaces the bare-handle prefix
  const prefix = kind === config.defaultKind ? (config.handlePrefix ?? '') : '';
  return `${config.baseUrl}${kind ? `${kind}/` : ''}${prefix}${encode(handle)}`;
}

// Returns the profile URL or null when the input is empty, has spaces or is a URL of another site.
export function buildSocialUrl(config: SocialUrlConfig, input: string): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;

  const firstPart = value.replace(HAS_SCHEME, '').split(/[/?#]/)[0];
  const isUrl = HAS_SCHEME.test(value) || config.hosts.includes(stripHostPrefix(firstPart));

  if (!isUrl) return buildFromSegments(config, value.split('/').filter(Boolean));

  let url: URL;
  try {
    url = new URL(HAS_SCHEME.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  // A URL of another network is not a valid profile for this template
  if (!config.hosts.includes(stripHostPrefix(url.hostname))) return null;
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const asIs = `https://${url.hostname}${url.pathname}${url.search}`;
  if (config.passthrough?.includes(segments[0].toLowerCase())) return asIs;
  return buildFromSegments(config, segments) ?? asIs;
}
