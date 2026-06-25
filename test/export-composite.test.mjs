import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldCompositeDrawingLayer,
  getExportDimensions
} from '../src/scripts/canvas/export-composite.js';

test('shouldCompositeDrawingLayer rejects null and zero-size layers', () => {
  assert.equal(shouldCompositeDrawingLayer(null), false);
  assert.equal(shouldCompositeDrawingLayer(undefined), false);
  assert.equal(shouldCompositeDrawingLayer({ width: 0, height: 100 }), false);
  assert.equal(shouldCompositeDrawingLayer({ width: 100, height: 0 }), false);
  assert.equal(shouldCompositeDrawingLayer({ width: 800, height: 600 }), true);
});

test('getExportDimensions floors and clamps invalid values', () => {
  assert.deepEqual(getExportDimensions(800, 600), { width: 800, height: 600 });
  assert.deepEqual(getExportDimensions(800.9, 600.1), { width: 800, height: 600 });
  assert.deepEqual(getExportDimensions(-10, NaN), { width: 0, height: 0 });
});

test('getExportDimensions guards exportPNG zero-size regression', () => {
  const { width, height } = getExportDimensions(0, 0);
  assert.equal(width, 0);
  assert.equal(height, 0);
  assert.equal(shouldCompositeDrawingLayer({ width, height }), false);
});
