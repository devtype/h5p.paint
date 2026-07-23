import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTHOR_PALETTE_SIZE,
  DEFAULT_PALETTE_COLORS,
  normalizePaletteColors,
  normalizeColorMode,
  resolveToolbarTools,
  resolveBrushDefaults
} from '../src/scripts/canvas/brush-config.js';

test('normalizePaletteColors returns defaults for empty input', () => {
  assert.deepEqual(normalizePaletteColors(null), DEFAULT_PALETTE_COLORS);
  assert.deepEqual(normalizePaletteColors([]), DEFAULT_PALETTE_COLORS);
});

test('normalizePaletteColors reads string list colors', () => {
  assert.deepEqual(
    normalizePaletteColors([
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '000000'
    ]),
    ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#000000']
  );
});

test('normalizePaletteColors reads object list colors', () => {
  assert.deepEqual(
    normalizePaletteColors([
      { color: '#ff0000' },
      { color: '#00ff00' },
      { color: '#0000ff' }
    ]),
    ['#ff0000', '#00ff00', '#0000ff']
  );
});

test('normalizePaletteColors reads legacy group colors', () => {
  assert.deepEqual(
    normalizePaletteColors({
      color1: '#ff0000',
      color2: '#00ff00',
      color3: '#0000ff',
      color4: '#ffff00',
      color5: '000000'
    }),
    ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#000000']
  );
});

test('normalizePaletteColors ignores extra legacy group slots', () => {
  assert.deepEqual(
    normalizePaletteColors({
      color1: '#ff0000',
      color2: '#00ff00',
      color3: '#0000ff',
      color4: '#ffff00',
      color5: '#000000',
      color6: '#7c3aed',
      color7: '#854d0e',
      color8: '#111111'
    }),
    ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#000000']
  );
});

test('normalizePaletteColors truncates lists longer than five', () => {
  assert.deepEqual(
    normalizePaletteColors([
      '#111111',
      '#222222',
      '#333333',
      '#444444',
      '#555555',
      '#666666'
    ]),
    ['#111111', '#222222', '#333333', '#444444', '#555555']
  );
});

test('normalizePaletteColors accepts a single valid color', () => {
  assert.deepEqual(
    normalizePaletteColors([{ color: '#ff0000' }]),
    ['#ff0000']
  );
});

test('normalizePaletteColors falls back when no valid colors', () => {
  assert.deepEqual(
    normalizePaletteColors([{}, {}, {}]),
    DEFAULT_PALETTE_COLORS
  );
});

test('normalizeColorMode defaults to full', () => {
  assert.equal(normalizeColorMode(undefined), 'full');
  assert.equal(normalizeColorMode('invalid'), 'full');
  assert.equal(normalizeColorMode('palette'), 'palette');
  assert.equal(normalizeColorMode('fixed'), 'fixed');
});

test('resolveToolbarTools strips color when fixed', () => {
  assert.deepEqual(
    resolveToolbarTools(['pencil', 'color', 'size'], 'fixed'),
    ['pencil', 'size']
  );
  assert.deepEqual(
    resolveToolbarTools(['pencil', 'color'], 'full'),
    ['pencil', 'color']
  );
});

test('resolveBrushDefaults always puts default color first in palette mode', () => {
  const brush = resolveBrushDefaults({
    brushDefaults: {
      defaultColor: '#000000',
      colorMode: 'palette',
      paletteColors: ['#ff0000', '#00ff00', '#0000ff']
    }
  });

  assert.equal(brush.defaultColor, '#000000');
  assert.deepEqual(brush.paletteColors, ['#000000', '#ff0000', '#00ff00', '#0000ff']);
});

test('resolveBrushDefaults dedupes default color from author palette', () => {
  const brush = resolveBrushDefaults({
    brushDefaults: {
      defaultColor: '#000000',
      colorMode: 'palette',
      paletteColors: ['#ff0000', '#000000', '#00ff00']
    }
  });

  assert.deepEqual(brush.paletteColors, ['#000000', '#ff0000', '#00ff00']);
});

test('resolveBrushDefaults limits author palette to five colors', () => {
  const brush = resolveBrushDefaults({
    brushDefaults: {
      defaultColor: '#000000',
      colorMode: 'palette',
      paletteColors: [
        '#111111',
        '#333333',
        '#444444',
        '#555555',
        '#666666',
        '#777777'
      ]
    }
  });

  assert.equal(brush.paletteColors.length, AUTHOR_PALETTE_SIZE + 1);
  assert.equal(brush.paletteColors[0], '#000000');
  assert.equal(brush.paletteColors[5], '#666666');
});

test('resolveBrushDefaults still reads legacy color1-color5 group', () => {
  const brush = resolveBrushDefaults({
    brushDefaults: {
      defaultColor: '#000000',
      colorMode: 'palette',
      paletteColors: {
        color1: '#ff0000',
        color2: '#00ff00'
      }
    }
  });

  assert.deepEqual(brush.paletteColors, ['#000000', '#ff0000', '#00ff00']);
});
