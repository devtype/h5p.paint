/**
 * Pure helpers for PNG export compositing (testable without Fabric).
 */

/**
 * Whether a Fabric drawing layer should be drawn onto the export canvas.
 *
 * @param {{ width?: number, height?: number }|null|undefined} layer
 * @returns {boolean}
 */
export function shouldCompositeDrawingLayer(layer) {
  return !!(layer && layer.width > 0 && layer.height > 0);
}

/**
 * Normalise export dimensions from canvas base size.
 *
 * @param {number} baseWidth
 * @param {number} baseHeight
 * @returns {{ width: number, height: number }}
 */
export function getExportDimensions(baseWidth, baseHeight) {
  const width = Math.max(0, Math.floor(Number(baseWidth) || 0));
  const height = Math.max(0, Math.floor(Number(baseHeight) || 0));
  return { width, height };
}

/**
 * Composite background and optional drawing layer into a PNG data URL.
 *
 * @param {number} width
 * @param {number} height
 * @param {function(CanvasRenderingContext2D, number, number): void} drawBackground
 * @param {HTMLCanvasElement|null|undefined} drawingLayer
 * @returns {string}
 */
export function compositeExportPng(width, height, drawBackground, drawingLayer) {
  const merge = document.createElement('canvas');
  merge.width = width;
  merge.height = height;
  const ctx = merge.getContext('2d');
  drawBackground(ctx, width, height);
  if (shouldCompositeDrawingLayer(drawingLayer)) {
    ctx.drawImage(drawingLayer, 0, 0, width, height);
  }
  return merge.toDataURL('image/png');
}
