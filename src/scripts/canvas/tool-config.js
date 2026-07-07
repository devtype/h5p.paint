export const DRAWING_TOOLS = [
  'pencil', 'brush', 'eraser', 'line', 'rect', 'ellipse', 'text'
];
export const CONTROL_TOOLS = ['color', 'size'];
export const ACTION_TOOLS = ['undo', 'redo', 'clear'];
export const ALL_TOOLS = [...DRAWING_TOOLS, ...CONTROL_TOOLS, ...ACTION_TOOLS];

export const DEFAULT_TOOLS_OBJECT = Object.fromEntries(ALL_TOOLS.map((t) => [t, true]));

/**
 * Normalize author tool config from checkbox object or legacy string array.
 *
 * @param {object|string[]|null|undefined} raw
 * @returns {string[]}
 */
export function toolsFromAuthorInput(raw) {
  if (Array.isArray(raw)) {
    return ALL_TOOLS.filter((t) => raw.includes(t));
  }
  if (raw && typeof raw === 'object') {
    const fromBooleans = ALL_TOOLS.filter((t) => raw[t] === true);
    if (fromBooleans.length) {
      return fromBooleans;
    }
    const legacyValues = Object.values(raw).filter((v) => typeof v === 'string');
    if (legacyValues.length) {
      return ALL_TOOLS.filter((t) => legacyValues.includes(t));
    }
    return [];
  }
  return [...ALL_TOOLS];
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
    tools.unshift('pencil');
  }

  return ALL_TOOLS.filter((t) => tools.includes(t));
}

/**
 * @param {string[]} tools
 * @returns {string}
 */
export function resolveInitialDrawingTool(tools) {
  return DRAWING_TOOLS.find((t) => tools.includes(t)) || 'pencil';
}
