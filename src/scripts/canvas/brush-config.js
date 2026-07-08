export const DEFAULT_PALETTE_COLORS = [
  '#e11d48',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
  '#7c3aed'
];

export const COLOR_MODES = ['full', 'palette', 'fixed'];

/**
 * @param {string} value
 * @returns {boolean}
 */
function isValidHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * @param {Array<{color?: string}|string>|Record<string, string>|null|undefined} raw
 * @returns {string[]}
 */
export function extractPaletteColors(raw) {
  if (Array.isArray(raw)) {
    return raw.map((entry, index) => {
      const color = typeof entry === 'string' ? entry : entry?.color;
      if (isValidHexColor(color)) {
        return color;
      }
      return DEFAULT_PALETTE_COLORS[index % DEFAULT_PALETTE_COLORS.length];
    });
  }

  if (raw && typeof raw === 'object') {
    return Object.keys(raw)
      .filter((key) => /^color\d+$/.test(key))
      .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)))
      .map((key) => raw[key])
      .filter(isValidHexColor);
  }

  return [];
}

/**
 * @param {Array<{color?: string}|string>|Record<string, string>|null|undefined} raw
 * @returns {string[]}
 */
export function normalizePaletteColors(raw) {
  const colors = extractPaletteColors(raw);
  return colors.length >= 2 ? colors : [...DEFAULT_PALETTE_COLORS];
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
  const paletteColors = normalizePaletteColors(nested?.paletteColors);
  let defaultColor = nested?.defaultColor ?? canvas?.defaultColor ?? '#222222';

  if (!isValidHexColor(defaultColor)) {
    defaultColor = '#222222';
  }

  if (colorMode === 'palette' && !paletteColors.includes(defaultColor)) {
    defaultColor = paletteColors[0];
  }

  return {
    defaultColor,
    defaultBrushSize: nested?.defaultBrushSize ?? canvas?.defaultBrushSize ?? 4,
    colorMode,
    paletteColors
  };
}
