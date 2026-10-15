import type { QROptions, GradientConfig } from '../../types/qr';
import { PRESETS_KEY, dotTypes, cornerSquareTypes, cornerDotTypes, gradientTypes } from '../../types/qr';

// Styling subset saved in a preset. Never includes `data` or `image` (privacy: see CLAUDE.md rule 1).
export type PresetStyle = Pick<
  QROptions,
  | 'dotColor'
  | 'dotGradient'
  | 'dotType'
  | 'cornerSquareColor'
  | 'cornerSquareType'
  | 'cornerDotColor'
  | 'cornerDotType'
  | 'backgroundColor'
  | 'transparentBackground'
>;

export interface UserPreset {
  id: string;
  name: string;
  style: PresetStyle;
}

export const MAX_USER_PRESETS = 50;
export const MAX_PRESET_NAME_LENGTH = 40;
// Guard against importing absurdly large files
export const MAX_IMPORT_BYTES = 256 * 1024;

const EXPORT_FORMAT = 'qr-code-builder-presets';
const EXPORT_VERSION = 1;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isColor = (value: unknown): value is string => typeof value === 'string' && HEX_COLOR.test(value);

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

const parseGradient = (value: unknown): GradientConfig | null => {
  if (!isRecord(value)) return null;
  const { enabled, type, rotation, colorStops } = value;
  if (typeof enabled !== 'boolean' || !isOneOf(gradientTypes, type)) return null;
  if (typeof rotation !== 'number' || !Number.isFinite(rotation) || rotation < 0 || rotation > 360) return null;
  if (!Array.isArray(colorStops) || colorStops.length !== 2) return null;
  const stops: GradientConfig['colorStops'] = [];
  for (const stop of colorStops) {
    if (!isRecord(stop) || !isColor(stop.color)) return null;
    const { offset } = stop;
    if (typeof offset !== 'number' || !Number.isFinite(offset) || offset < 0 || offset > 1) return null;
    stops.push({ offset, color: stop.color });
  }
  return { enabled, type, rotation, colorStops: stops };
};

// Strict validation: rebuilds the object from known keys only, so unknown keys are dropped
const parseStyle = (value: unknown): PresetStyle | null => {
  if (!isRecord(value)) return null;
  const dotGradient = parseGradient(value.dotGradient);
  if (
    !dotGradient ||
    !isColor(value.dotColor) ||
    !isColor(value.cornerSquareColor) ||
    !isColor(value.cornerDotColor) ||
    !isColor(value.backgroundColor) ||
    !isOneOf(dotTypes, value.dotType) ||
    !isOneOf(cornerSquareTypes, value.cornerSquareType) ||
    !isOneOf(cornerDotTypes, value.cornerDotType) ||
    typeof value.transparentBackground !== 'boolean'
  ) {
    return null;
  }
  return {
    dotColor: value.dotColor,
    dotGradient,
    dotType: value.dotType,
    cornerSquareColor: value.cornerSquareColor,
    cornerSquareType: value.cornerSquareType,
    cornerDotColor: value.cornerDotColor,
    cornerDotType: value.cornerDotType,
    backgroundColor: value.backgroundColor,
    transparentBackground: value.transparentBackground,
  };
};

const parseName = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length > 0 && name.length <= MAX_PRESET_NAME_LENGTH ? name : null;
};

export const createPresetId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const pickStyle = (options: QROptions): PresetStyle => ({
  dotColor: options.dotColor,
  dotGradient: {
    ...options.dotGradient,
    colorStops: options.dotGradient.colorStops.map((stop) => ({ ...stop })),
  },
  dotType: options.dotType,
  cornerSquareColor: options.cornerSquareColor,
  cornerSquareType: options.cornerSquareType,
  cornerDotColor: options.cornerDotColor,
  cornerDotType: options.cornerDotType,
  backgroundColor: options.backgroundColor,
  transparentBackground: options.transparentBackground,
});

// Validates a list of untrusted `{ name, style }` entries; invalid entries are skipped
const parsePresetList = (value: unknown): UserPreset[] => {
  if (!Array.isArray(value)) return [];
  const presets: UserPreset[] = [];
  for (const entry of value) {
    if (presets.length >= MAX_USER_PRESETS) break;
    if (!isRecord(entry)) continue;
    const name = parseName(entry.name);
    const style = parseStyle(entry.style);
    if (name && style) presets.push({ id: createPresetId(), name, style });
  }
  return presets;
};

export const loadUserPresets = (): UserPreset[] => {
  try {
    const saved = localStorage.getItem(PRESETS_KEY);
    return saved ? parsePresetList(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
};

// Returns false when the browser refuses to store (private mode, quota)
export const saveUserPresets = (presets: UserPreset[]): boolean => {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.map(({ name, style }) => ({ name, style }))));
    return true;
  } catch {
    return false;
  }
};

export const serializePresets = (presets: UserPreset[]): string =>
  JSON.stringify(
    { format: EXPORT_FORMAT, version: EXPORT_VERSION, presets: presets.map(({ name, style }) => ({ name, style })) },
    null,
    2,
  );

// Accepts the exported envelope or a bare array; returns null when the file is not a presets file
export const parseImportedPresets = (text: string): UserPreset[] | null => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const list = Array.isArray(json) ? json : isRecord(json) ? json.presets : undefined;
  if (!Array.isArray(list)) return null;
  const presets = parsePresetList(list);
  return presets.length > 0 ? presets : null;
};

export interface MergeResult {
  presets: UserPreset[];
  added: number;
  replaced: number;
}

// Merges by (case-insensitive) name: an existing preset with the same name is replaced, up to the cap.
// `added` / `replaced` count the entries that actually changed the list (entries over the cap are dropped).
export const mergePresetsWithCounts = (current: UserPreset[], incoming: UserPreset[]): MergeResult => {
  const presets = [...current];
  let added = 0;
  let replaced = 0;
  for (const preset of incoming) {
    const index = presets.findIndex((p) => p.name.toLowerCase() === preset.name.toLowerCase());
    if (index >= 0) {
      presets[index] = { ...preset, id: presets[index].id };
      replaced++;
    } else if (presets.length < MAX_USER_PRESETS) {
      presets.push(preset);
      added++;
    }
  }
  return { presets, added, replaced };
};

export const mergePresets = (current: UserPreset[], incoming: UserPreset[]): UserPreset[] =>
  mergePresetsWithCounts(current, incoming).presets;
