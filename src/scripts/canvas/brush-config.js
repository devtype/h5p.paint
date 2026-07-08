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
 * @param {Array<{color?: string}|string>|null|undefined} raw
 * @returns {string[]}
 */
export function normalizePaletteColors(raw) {
  if (!Array.isArray(raw) || !raw.length) {
    return [...DEFAULT_PALETTE_COLORS];
  }

  const colors = raw
    .map((entry) => (typeof entry === 'string' ? entry : entry?.color))
    .filter(isValidHexColor);

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
