import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'canvas-state-v5.json'
);

test('canvas-state-v5 fixture has objects and eraser composite op', () => {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  assert.equal(fixture.version, '5.3.0');
  assert.ok(Array.isArray(fixture.objects));
  assert.equal(fixture.objects.length, 2);
  const eraserPath = fixture.objects.find((o) => o.type === 'path');
  assert.equal(eraserPath.globalCompositeOperation, 'destination-out');
});

test('canvas-state-v5 fixture strips background keys like loadFromJSON', () => {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  const payload = { ...fixture };
  delete payload.backgroundImage;
  delete payload.background;
  delete payload.backgroundColor;
  assert.equal(payload.background, undefined);
  assert.ok(payload.objects.length > 0);
});
