import { test } from 'node:test';
import assert from 'node:assert/strict';
import XapiService from '../src/scripts/services/xapi.js';

function createMockEvent() {
  return {
    data: {
      statement: {
        object: {}
      }
    }
  };
}

test('decorate sets answered verb and interaction type', () => {
  const event = createMockEvent();
  XapiService.decorate(event, {
    params: { taskDescription: '<p>Draw a cell</p>' },
    contentId: 1,
    dataUrl: null,
    summary: { objectCount: 2, width: 800, height: 600 },
    getTitle: () => 'Plant cell'
  });

  const statement = event.data.statement;
  assert.equal(statement.verb.id, 'http://adlnet.gov/expapi/verbs/answered');
  assert.equal(statement.object.definition.interactionType, 'other');
  assert.equal(statement.object.definition.type, 'http://adlnet.gov/expapi/activities/cmi.interaction');
  assert.equal(statement.result.completion, true);
  assert.equal(statement.result.response, 'drawing:2objects,800x600');
});

test('decorate strips HTML from task description', () => {
  const event = createMockEvent();
  XapiService.decorate(event, {
    params: { taskDescription: '<p>Hello <strong>world</strong></p>' },
    contentId: 1,
    dataUrl: null,
    summary: null,
    getTitle: () => 'Title'
  });

  assert.equal(
    event.data.statement.object.definition.description['en-US'],
    'Hello world'
  );
});

test('decorate includes score when includeScore is true', () => {
  const event = createMockEvent();
  XapiService.decorate(event, {
    params: {},
    contentId: 1,
    dataUrl: null,
    summary: { objectCount: 1, width: 100, height: 100 },
    includeScore: true,
    score: 3,
    maxScore: 5,
    getTitle: () => 'Q'
  });

  assert.deepEqual(event.data.statement.result.score, {
    raw: 3,
    max: 5,
    scaled: 0.6
  });
});

test('decorate omits score when includeScore is false', () => {
  const event = createMockEvent();
  XapiService.decorate(event, {
    params: {},
    contentId: 1,
    dataUrl: null,
    summary: { objectCount: 1, width: 100, height: 100 },
    includeScore: false,
    score: 3,
    maxScore: 5,
    getTitle: () => 'Q'
  });

  assert.equal(event.data.statement.result.score, undefined);
});

test('decorate appends AI feedback and confidence to response', () => {
  const event = createMockEvent();
  XapiService.decorate(event, {
    params: {},
    contentId: 1,
    dataUrl: null,
    summary: { objectCount: 1, width: 400, height: 300 },
    aiFeedback: 'Good labels.',
    aiConfidence: 0.876,
    getTitle: () => 'Q'
  });

  const response = event.data.statement.result.response;
  assert.match(response, /feedback:Good labels\./);
  assert.match(response, /confidence:0\.88/);
});
