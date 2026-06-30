import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveScore,
  shouldIncludeScoreInXapi,
  normalizeRestoredAiState
} from '../src/scripts/services/scoring.js';

test('resolveScore manual always returns 0', () => {
  assert.equal(resolveScore({
    mode: 'manual',
    submitted: true,
    hasDrawing: true,
    maxScore: 5,
    aiGradingStatus: 'idle',
    aiScore: null
  }), 0);
});

test('resolveScore completion requires submit and drawing', () => {
  const base = {
    mode: 'completion',
    submitted: true,
    hasDrawing: true,
    maxScore: 5,
    aiGradingStatus: 'idle',
    aiScore: null
  };
  assert.equal(resolveScore(base), 5);
  assert.equal(resolveScore({ ...base, submitted: false }), 0);
  assert.equal(resolveScore({ ...base, hasDrawing: false }), 0);
});

test('resolveScore ai returns score when done or error', () => {
  const base = {
    mode: 'ai',
    submitted: true,
    hasDrawing: true,
    maxScore: 5,
    aiScore: 3
  };
  assert.equal(resolveScore({ ...base, aiGradingStatus: 'done' }), 3);
  assert.equal(resolveScore({ ...base, aiGradingStatus: 'error' }), 3);
  assert.equal(resolveScore({ ...base, aiGradingStatus: 'pending' }), 0);
  assert.equal(resolveScore({ ...base, aiGradingStatus: 'idle' }), 0);
});

test('shouldIncludeScoreInXapi matrix', () => {
  assert.equal(shouldIncludeScoreInXapi({
    mode: 'manual',
    submitted: true,
    aiGradingStatus: 'idle',
    score: 0
  }), false);

  assert.equal(shouldIncludeScoreInXapi({
    mode: 'completion',
    submitted: true,
    aiGradingStatus: 'idle',
    score: 5
  }), true);

  assert.equal(shouldIncludeScoreInXapi({
    mode: 'ai',
    submitted: false,
    aiGradingStatus: 'pending',
    score: 0
  }), false);

  assert.equal(shouldIncludeScoreInXapi({
    mode: 'ai',
    submitted: true,
    aiGradingStatus: 'pending',
    score: 0
  }), false);

  assert.equal(shouldIncludeScoreInXapi({
    mode: 'ai',
    submitted: true,
    aiGradingStatus: 'done',
    score: 4
  }), true);

  assert.equal(shouldIncludeScoreInXapi({
    mode: 'ai',
    submitted: true,
    aiGradingStatus: 'error',
    score: 0
  }), false);

  assert.equal(shouldIncludeScoreInXapi({
    mode: 'ai',
    submitted: true,
    aiGradingStatus: 'error',
    score: 5
  }), true);
});

test('normalizeRestoredAiState resets pending unsubmitted', () => {
  assert.deepEqual(normalizeRestoredAiState({
    submitted: false,
    aiGradingStatus: 'pending'
  }), { aiGradingStatus: 'idle', interrupted: true });

  assert.deepEqual(normalizeRestoredAiState({
    submitted: true,
    aiGradingStatus: 'pending'
  }), { aiGradingStatus: 'pending', interrupted: false });

  assert.deepEqual(normalizeRestoredAiState({
    submitted: true,
    aiGradingStatus: 'done'
  }), { aiGradingStatus: 'done', interrupted: false });

  assert.deepEqual(normalizeRestoredAiState(null), {
    aiGradingStatus: 'idle',
    interrupted: false
  });
});
