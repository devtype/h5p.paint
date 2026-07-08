import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import Toolbar from '../src/scripts/ui/toolbar.js';

test('Toolbar renders only enabled tools', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;

  const toolbar = new Toolbar({
    tools: ['pencil', 'eraser', 'undo', 'clear'],
    initialTool: 'eraser',
    onAction: () => {}
  });

  const buttons = toolbar.getElement().querySelectorAll('button');
  assert.equal(buttons.length, 4);

  const eraserBtn = toolbar.getElement().querySelector('[data-tool="eraser"]');
  assert.equal(eraserBtn.getAttribute('aria-pressed'), 'true');
});

test('Toolbar includes color and size controls when enabled', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;

  const toolbar = new Toolbar({
    tools: ['pencil', 'color', 'size'],
    initialTool: 'pencil',
    onAction: () => {}
  });

  assert.ok(toolbar.getElement().querySelector('.h5p-paint__color-input'));
  assert.ok(toolbar.getElement().querySelector('.h5p-paint__size-input'));
  assert.equal(toolbar.getElement().querySelectorAll('button').length, 1);
});

test('Toolbar renders palette swatches in palette color mode', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;

  const paletteColors = ['#ff0000', '#00ff00', '#0000ff'];
  const toolbar = new Toolbar({
    tools: ['pencil', 'color'],
    colorMode: 'palette',
    paletteColors,
    defaultColor: '#ff0000',
    onAction: () => {}
  });

  assert.equal(
    toolbar.getElement().querySelectorAll('.h5p-paint__palette-swatch').length,
    paletteColors.length
  );
  assert.equal(toolbar.getElement().querySelector('.h5p-paint__color-input'), null);

  const selected = toolbar.getElement().querySelector('.h5p-paint__palette-swatch.is-selected');
  assert.equal(selected.getAttribute('aria-pressed'), 'true');
  assert.equal(selected.style.backgroundColor, 'rgb(255, 0, 0)');
});

test('Toolbar full color mode is unchanged when colorMode omitted', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;

  const toolbar = new Toolbar({
    tools: ['pencil', 'color'],
    onAction: () => {}
  });

  assert.ok(toolbar.getElement().querySelector('.h5p-paint__color-input'));
  assert.equal(toolbar.getElement().querySelector('.h5p-paint__palette'), null);
});

test('Toolbar without color tool renders no palette or color input', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;

  const toolbar = new Toolbar({
    tools: ['pencil', 'eraser'],
    onAction: () => {}
  });

  assert.equal(toolbar.getElement().querySelector('.h5p-paint__color-input'), null);
  assert.equal(toolbar.getElement().querySelector('.h5p-paint__palette'), null);
});
