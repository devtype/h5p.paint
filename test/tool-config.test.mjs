import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_TOOLS,
  resolveInitialDrawingTool,
  resolveTools,
  toolsFromAuthorInput
} from '../src/scripts/canvas/tool-config.js';

test('toolsFromAuthorInput reads boolean object', () => {
  const tools = toolsFromAuthorInput({
    pencil: true,
    brush: false,
    eraser: true,
    line: false,
    rect: false,
    ellipse: false,
    text: false,
    color: false,
    size: false,
    undo: true,
    redo: false,
    clear: true
  });
  assert.deepEqual(tools, ['pencil', 'eraser', 'undo', 'clear']);
});

test('toolsFromAuthorInput reads legacy string array', () => {
  const tools = toolsFromAuthorInput(['pencil', 'eraser', 'undo', 'unknown']);
  assert.deepEqual(tools, ['pencil', 'eraser', 'undo']);
});

test('resolveTools auto-appends color for shape tools', () => {
  const tools = resolveTools({
    line: true,
    rect: true,
    pencil: false,
    brush: false,
    eraser: false,
    ellipse: false,
    text: false,
    color: false,
    size: false,
    undo: false,
    redo: false,
    clear: false
  });
  assert.ok(tools.includes('line'));
  assert.ok(tools.includes('rect'));
  assert.ok(tools.includes('color'));
});

test('resolveTools auto-appends size for freehand tools', () => {
  const tools = resolveTools({
    pencil: true,
    brush: false,
    eraser: false,
    line: false,
    rect: false,
    ellipse: false,
    text: false,
    color: true,
    size: false,
    undo: false,
    redo: false,
    clear: false
  });
  assert.ok(tools.includes('pencil'));
  assert.ok(tools.includes('size'));
});

test('resolveTools forces pencil when no drawing tool selected', () => {
  const tools = resolveTools({
    pencil: false,
    brush: false,
    eraser: false,
    line: false,
    rect: false,
    ellipse: false,
    text: false,
    color: false,
    size: false,
    undo: true,
    redo: false,
    clear: false
  });
  assert.ok(tools.includes('pencil'));
});

test('resolveTools preserves ALL_TOOLS order', () => {
  const tools = resolveTools(['clear', 'pencil', 'undo']);
  assert.deepEqual(tools, ['pencil', 'color', 'size', 'undo', 'clear']);
});

test('resolveInitialDrawingTool skips disabled pencil', () => {
  const tools = resolveTools({
    pencil: false,
    brush: false,
    eraser: true,
    line: false,
    rect: false,
    ellipse: false,
    text: false,
    color: true,
    size: true,
    undo: false,
    redo: false,
    clear: false
  });
  assert.equal(resolveInitialDrawingTool(tools), 'eraser');
});

test('resolveTools empty input falls back to full tool set', () => {
  assert.deepEqual(resolveTools([]), ALL_TOOLS);
});
