import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_TOOLS,
  TOOL_PRESETS,
  resolveInitialDrawingTool,
  resolveTools,
  toolsFromAuthorInput
} from '../src/scripts/canvas/tool-config.js';

test('toolsFromAuthorInput reads flat legacy boolean object', () => {
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

test('resolveTools sketch preset', () => {
  const tools = resolveTools({ preset: 'sketch', defaultTool: 'pencil' });
  assert.deepEqual(tools, [
    'pencil', 'brush', 'eraser', 'color', 'size', 'undo', 'redo', 'clear'
  ]);
});

test('resolveTools annotate preset', () => {
  const tools = resolveTools({ preset: 'annotate' });
  assert.deepEqual(tools, [
    'pencil', 'eraser', 'line', 'text', 'color', 'size', 'undo', 'redo', 'clear'
  ]);
});

test('resolveTools shapes preset', () => {
  const tools = resolveTools({ preset: 'shapes' });
  assert.deepEqual(tools, [
    'line', 'rect', 'ellipse', 'text', 'color', 'undo', 'redo', 'clear'
  ]);
});

test('resolveTools custom nested groups', () => {
  const tools = resolveTools({
    preset: 'custom',
    defaultTool: 'line',
    drawing: {
      pencil: false,
      brush: false,
      eraser: false,
      line: true,
      rect: true,
      ellipse: false,
      text: false
    },
    controls: { color: true, size: false },
    actions: { undo: true, redo: false, clear: true }
  });
  assert.deepEqual(tools, ['line', 'rect', 'color', 'undo', 'clear']);
});

test('resolveTools respects deselected color and size in custom preset', () => {
  const tools = resolveTools({
    preset: 'custom',
    drawing: {
      pencil: true,
      brush: true,
      eraser: true,
      line: false,
      rect: false,
      ellipse: false,
      text: false
    },
    controls: { color: false, size: false },
    actions: { undo: true, redo: true, clear: true }
  });
  assert.deepEqual(tools, ['pencil', 'brush', 'eraser', 'undo', 'redo', 'clear']);
});

test('resolveTools forces pencil when no drawing tool selected', () => {
  const tools = resolveTools({
    preset: 'custom',
    drawing: {
      pencil: false,
      brush: false,
      eraser: false,
      line: false,
      rect: false,
      ellipse: false,
      text: false
    },
    controls: { color: false, size: false },
    actions: { undo: true, redo: false, clear: false }
  });
  assert.ok(tools.includes('pencil'));
});

test('resolveTools preserves ALL_TOOLS order', () => {
  const tools = resolveTools(['clear', 'pencil', 'undo']);
  assert.deepEqual(tools, ['pencil', 'undo', 'clear']);
});

test('resolveInitialDrawingTool uses author defaultTool when enabled', () => {
  const tools = resolveTools({ preset: 'sketch' });
  assert.equal(resolveInitialDrawingTool(tools, 'brush'), 'brush');
});

test('resolveInitialDrawingTool falls back when defaultTool disabled', () => {
  const tools = resolveTools({ preset: 'shapes' });
  assert.equal(resolveInitialDrawingTool(tools, 'pencil'), 'line');
});

test('resolveInitialDrawingTool skips disabled pencil without preferred', () => {
  const tools = resolveTools({
    preset: 'custom',
    drawing: {
      pencil: false,
      brush: false,
      eraser: true,
      line: false,
      rect: false,
      ellipse: false,
      text: false
    },
    controls: { color: true, size: true },
    actions: { undo: false, redo: false, clear: false }
  });
  assert.equal(resolveInitialDrawingTool(tools), 'eraser');
});

test('resolveTools empty input falls back to full tool set', () => {
  assert.deepEqual(resolveTools([]), ALL_TOOLS);
});

test('TOOL_PRESETS full enables every tool', () => {
  assert.deepEqual(
    toolsFromAuthorInput({ preset: 'full' }),
    ALL_TOOLS
  );
  assert.equal(Object.values(TOOL_PRESETS.full).every(Boolean), true);
});
