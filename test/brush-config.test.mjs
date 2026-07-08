import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
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

test('normalizePaletteColors maps group fields to hex array', () => {
  assert.deepEqual(
    normalizePaletteColors({
      color1: '#ff0000',
      color2: '#00ff00',
      color3: '#0000ff'
    }),
    ['#ff0000', '#00ff00', '#0000ff']
  );
});

test('normalizePaletteColors maps legacy list items to hex array', () => {
  assert.deepEqual(
    normalizePaletteColors([
      { color: '#ff0000' },
      { color: '#00ff00' },
      { color: '#0000ff' }
    ]),
    ['#ff0000', '#00ff00', '#0000ff']
  );
});

test('normalizePaletteColors fills empty legacy list slots from defaults', () => {
  assert.deepEqual(
    normalizePaletteColors([{}, {}, {}]),
    DEFAULT_PALETTE_COLORS.slice(0, 3)
  );
});

test('normalizePaletteColors falls back when fewer than two valid colors', () => {
  assert.deepEqual(
    normalizePaletteColors([{ color: '#ff0000' }]),
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

test('resolveBrushDefaults uses first palette color when default is not in palette', () => {
  const brush = resolveBrushDefaults({
    brushDefaults: {
      defaultColor: '#222222',
      colorMode: 'palette',
      paletteColors: [{ color: '#ff0000' }, { color: '#00ff00' }]
    }
  });

  assert.equal(brush.colorMode, 'palette');
  assert.equal(brush.defaultColor, '#ff0000');
  assert.deepEqual(brush.paletteColors, ['#ff0000', '#00ff00']);
});
