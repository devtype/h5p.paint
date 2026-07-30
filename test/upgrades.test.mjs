import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadUpgrades() {
  const sandbox = createContext({ H5PUpgrades: {} });
  runInContext(readFileSync(join(root, 'upgrades.js'), 'utf8'), sandbox);
  return sandbox.H5PUpgrades['H5P.Paint'];
}

function findUpgrade(upgrades, major, minor, patch) {
  return upgrades.find(
    (entry) =>
      entry.version.major === major
      && entry.version.minor === minor
      && entry.version.patch === patch
  );
}

function runUpgrade(upgrade, parameters) {
  return new Promise((resolve, reject) => {
    upgrade.up(parameters, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      // Clone out of the vm realm so deepEqual compares plain objects.
      resolve(JSON.parse(JSON.stringify(result)));
    });
  });
}

test('0.7.6 upgrades string list paletteColors to color items', async () => {
  const upgrade = findUpgrade(loadUpgrades(), 0, 7, 6);
  assert.ok(upgrade);

  const parameters = {
    canvas: {
      brushDefaults: {
        colorMode: 'palette',
        paletteColors: ['#ff0000', '#00ff00']
      }
    }
  };

  const result = await runUpgrade(upgrade, parameters);
  assert.deepEqual(result.canvas.brushDefaults.paletteColors, [
    { color: '#ff0000' },
    { color: '#00ff00' }
  ]);
});

test('0.7.6 upgrades legacy group paletteColors to color items', async () => {
  const upgrade = findUpgrade(loadUpgrades(), 0, 7, 6);
  const parameters = {
    canvas: {
      brushDefaults: {
        paletteColors: {
          color1: '#111111',
          color2: '#222222'
        }
      }
    }
  };

  const result = await runUpgrade(upgrade, parameters);
  assert.deepEqual(result.canvas.brushDefaults.paletteColors, [
    { color: '#111111' },
    { color: '#222222' }
  ]);
});

test('0.7.6 falls back to defaults when paletteColors has no valid colors', async () => {
  const upgrade = findUpgrade(loadUpgrades(), 0, 7, 6);
  const parameters = {
    canvas: {
      brushDefaults: {
        paletteColors: ['not-a-color', {}]
      }
    }
  };

  const result = await runUpgrade(upgrade, parameters);
  assert.deepEqual(result.canvas.brushDefaults.paletteColors, [
    { color: '#e11d48' },
    { color: '#ea580c' },
    { color: '#ca8a04' },
    { color: '#16a34a' },
    { color: '#2563eb' }
  ]);
});
