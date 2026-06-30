import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripHtml,
  sanitizeFeedback,
  clampScore,
  parseGradingResponse,
  resolveFailureScore,
  buildGradingPayload
} from '../src/scripts/services/ai-grader.js';

test('stripHtml removes tags and collapses whitespace', () => {
  assert.equal(stripHtml('<p>Draw a <strong>house</strong>.</p>'), 'Draw a house.');
});

test('clampScore bounds score to maxScore', () => {
  assert.equal(clampScore(7, 5), 5);
  assert.equal(clampScore(-1, 5), 0);
  assert.equal(clampScore(3.7, 5), 4);
  assert.equal(clampScore('bad', 5), 0);
});

test('parseGradingResponse extracts score and feedback', () => {
  const result = parseGradingResponse({
    score: 3,
    maxScore: 5,
    feedback: 'Good labels.',
    confidence: 1.5
  }, 5);
  assert.equal(result.score, 3);
  assert.equal(result.feedback, 'Good labels.');
  assert.equal(result.confidence, 1);
});

test('parseGradingResponse rejects missing score', () => {
  assert.throws(() => parseGradingResponse({}, 5), /missing score/);
});

test('resolveFailureScore applies onFailure policies', () => {
  assert.equal(resolveFailureScore('zero', 5, true), 0);
  assert.equal(resolveFailureScore('completion', 5, true), 5);
  assert.equal(resolveFailureScore('completion', 5, false), 0);
  assert.equal(resolveFailureScore('manual', 5, true), 0);
});

test('buildGradingPayload strips HTML and includes reference URL', () => {
  const payload = buildGradingPayload({
    contentId: 42,
    maxScore: 10,
    taskDescription: '<p>Label the diagram</p>',
    aiGrading: { rubric: '<em>All parts</em>', includeReferenceImage: true },
    dataUrl: 'data:image/png;base64,abc',
    summary: 'drawing:2objects,800x600',
    referenceImageUrl: 'https://example.com/ref.png'
  });
  assert.equal(payload.library, 'H5P.Paint');
  assert.equal(payload.contentId, 42);
  assert.equal(payload.taskDescription, 'Label the diagram');
  assert.equal(payload.rubric, 'All parts');
  assert.equal(payload.referenceImageUrl, 'https://example.com/ref.png');
  assert.equal(payload.drawing.dataUrl, 'data:image/png;base64,abc');
});

test('sanitizeFeedback strips HTML from feedback', () => {
  assert.equal(sanitizeFeedback('<b>Nice</b> work'), 'Nice work');
});
