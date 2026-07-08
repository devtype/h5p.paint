export const DRAWING_TOOLS = [
  'pencil', 'brush', 'eraser', 'line', 'rect', 'ellipse', 'text'
];
export const CONTROL_TOOLS = ['color', 'size'];
export const ACTION_TOOLS = ['undo', 'redo', 'clear'];
export const ALL_TOOLS = [...DRAWING_TOOLS, ...CONTROL_TOOLS, ...ACTION_TOOLS];

export const DEFAULT_TOOLS_OBJECT = Object.fromEntries(ALL_TOOLS.map((t) => [t, true]));

const CUSTOM_GROUPS = ['drawing', 'controls', 'actions'];

/**
 * @param {string[]} enabledIds
 * @returns {object}
 */
function presetObject(enabledIds) {
  const enabled = new Set(enabledIds);
  return Object.fromEntries(ALL_TOOLS.map((t) => [t, enabled.has(t)]));
}

export const TOOL_PRESETS = {
  full: { ...DEFAULT_TOOLS_OBJECT },
  sketch: presetObject([
    'pencil', 'brush', 'eraser', 'color', 'size', 'undo', 'redo', 'clear'
  ]),
  annotate: presetObject([
    'pencil', 'line', 'text', 'eraser', 'color', 'size', 'undo', 'redo', 'clear'
  ]),
  shapes: presetObject([
    'line', 'rect', 'ellipse', 'text', 'color', 'undo', 'redo', 'clear'
  ])
};

/**
 * @param {object} raw
 * @returns {object}
 */
function flattenCustomGroups(raw) {
  const merged = {};
  for (const group of CUSTOM_GROUPS) {
    if (raw[group] && typeof raw[group] === 'object') {
      Object.assign(merged, raw[group]);
    }
  }
  return merged;
}

/**
 * @param {object} raw
 * @returns {boolean}
 */
function isFlatLegacyToolsObject(raw) {
  return ALL_TOOLS.some((t) => typeof raw[t] === 'boolean');
}

/**
 * Build boolean map from raw author tools config.
 *
 * @param {object|string[]|null|undefined} raw
 * @returns {object|null}
 */
export function toolsBooleanMapFromAuthorInput(raw) {
  if (Array.isArray(raw)) {
    return presetObject(raw.filter((t) => ALL_TOOLS.includes(t)));
  }
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const preset = raw.preset;
  if (preset && preset !== 'custom' && TOOL_PRESETS[preset]) {
    return { ...TOOL_PRESETS[preset] };
  }

  if (preset === 'custom' || raw.drawing || raw.controls || raw.actions) {
    const custom = flattenCustomGroups(raw);
    if (Object.keys(custom).length) {
      return Object.fromEntries(
        ALL_TOOLS.map((t) => [t, custom[t] === true])
      );
    }
  }

  if (isFlatLegacyToolsObject(raw)) {
    return Object.fromEntries(ALL_TOOLS.map((t) => [t, raw[t] === true]));
  }

  const legacyValues = Object.values(raw).filter((v) => typeof v === 'string');
  if (legacyValues.length) {
    return presetObject(legacyValues.filter((t) => ALL_TOOLS.includes(t)));
  }

  return null;
}

/**
 * Normalize author tool config from presets, checkbox groups, or legacy formats.
 *
 * @param {object|string[]|null|undefined} raw
 * @returns {string[]}
 */
export function toolsFromAuthorInput(raw) {
  const map = toolsBooleanMapFromAuthorInput(raw);
  if (!map) {
    return [...ALL_TOOLS];
  }
  return ALL_TOOLS.filter((t) => map[t]);
}

/**
 * Resolve enabled toolbar tools with safe fallbacks.
 *
 * @param {object|string[]|null|undefined} raw
 * @returns {string[]}
 */
export function resolveTools(raw) {
  let tools = toolsFromAuthorInput(raw);
  if (!tools.length) {
    tools = [...ALL_TOOLS];
  }

  if (!DRAWING_TOOLS.some((t) => tools.includes(t))) {
    tools = ['pencil', ...tools.filter((t) => t !== 'pencil')];
  }

  return ALL_TOOLS.filter((t) => tools.includes(t));
}

/**
 * @param {string[]} tools
 * @param {string|null|undefined} preferred
 * @returns {string}
 */
export function resolveInitialDrawingTool(tools, preferred) {
  if (preferred && DRAWING_TOOLS.includes(preferred) && tools.includes(preferred)) {
    return preferred;
  }
  return DRAWING_TOOLS.find((t) => tools.includes(t)) || 'pencil';
}

/**
 * Default tools group for semantics merge (preset full + custom group defaults).
 *
 * @returns {object}
 */
export function defaultToolsSemantics() {
  return {
    preset: 'full',
    defaultTool: 'pencil',
    drawing: Object.fromEntries(DRAWING_TOOLS.map((t) => [t, true])),
    controls: Object.fromEntries(CONTROL_TOOLS.map((t) => [t, true])),
    actions: Object.fromEntries(ACTION_TOOLS.map((t) => [t, true]))
  };
}
