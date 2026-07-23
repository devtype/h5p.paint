export const AUTHOR_PALETTE_SIZE = 5;

export const DEFAULT_PALETTE_COLORS = [
  '#e11d48',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb'
];

export const PALETTE_COLOR_KEYS = [
  'color1',
  'color2',
  'color3',
  'color4',
  'color5'
];

export const COLOR_MODES = ['full', 'palette', 'fixed'];

/**
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
export function normalizeHexColor(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const hex = trimmed.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }
  return null;
}

/**
 * @param {Array<{color?: string}|string>|Record<string, string>|null|undefined} raw
 * @returns {string[]}
 */
export function extractPaletteColors(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        const color = typeof entry === 'string' ? entry : entry?.color;
        return normalizeHexColor(color);
      })
      .filter(Boolean)
      .slice(0, AUTHOR_PALETTE_SIZE);
  }

  if (raw && typeof raw === 'object') {
    return PALETTE_COLOR_KEYS
      .map((key) => normalizeHexColor(raw[key]))
      .filter(Boolean);
  }

  return [];
}

/**
 * @param {Array<{color?: string}|string>|Record<string, string>|null|undefined} raw
 * @returns {string[]}
 */
export function normalizePaletteColors(raw) {
  const colors = extractPaletteColors(raw);
  if (colors.length >= 1) {
    return colors.slice(0, AUTHOR_PALETTE_SIZE);
  }
  return [...DEFAULT_PALETTE_COLORS];
}

/**
 * @param {string|null|undefined} colorMode
 * @returns {'full'|'palette'|'fixed'}
 */
export function normalizeColorMode(colorMode) {
  if (COLOR_MODES.includes(colorMode)) {
    return colorMode;
  }
  return 'full';
}

/**
 * @param {string[]} tools
 * @param {string} colorMode
 * @returns {string[]}
 */
export function resolveToolbarTools(tools, colorMode) {
  if (colorMode === 'fixed') {
    return tools.filter((tool) => tool !== 'color');
  }
  return tools;
}

/**
 * Resolve brush defaults from nested semantics or legacy flat canvas fields.
 *
 * @param {object|null|undefined} canvas
 * @returns {{
 *   defaultColor: string,
 *   defaultBrushSize: number,
 *   colorMode: 'full'|'palette'|'fixed',
 *   paletteColors: string[]
 * }}
 */
export function resolveBrushDefaults(canvas) {
  const nested = canvas && canvas.brushDefaults;
  const colorMode = normalizeColorMode(nested?.colorMode);
  let paletteColors = normalizePaletteColors(nested?.paletteColors);
  const defaultColor = normalizeHexColor(
    nested?.defaultColor ?? canvas?.defaultColor ?? '#222222'
  ) || '#222222';

  if (colorMode === 'palette') {
    const authorColors = paletteColors.filter((color) => color !== defaultColor);
    paletteColors = [
      defaultColor,
      ...authorColors.slice(0, AUTHOR_PALETTE_SIZE)
    ];
  }

  return {
    defaultColor,
    defaultBrushSize: nested?.defaultBrushSize ?? canvas?.defaultBrushSize ?? 4,
    colorMode,
    paletteColors
  };
}
