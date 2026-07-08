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
