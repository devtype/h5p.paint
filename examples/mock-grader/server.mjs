#!/usr/bin/env node
/**
 * Minimal mock AI grader for local H5P.Paint development.
 * POST /grade with the contract from ../ai-grading-contract.md
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_SCORE = Number(process.env.MOCK_SCORE) || 4;

function clampScore(score, maxScore) {
  return Math.max(0, Math.min(maxScore, score));
}

function scoreFromRubric(rubric, maxScore) {
  const text = String(rubric || '').toLowerCase();
  if (!text.trim()) {
    return DEFAULT_SCORE;
  }
  let score = Math.ceil(maxScore * 0.5);
  if (text.includes('excellent') || text.includes('complete')) {
    score = maxScore;
  }
  else if (text.includes('partial') || text.includes('some')) {
    score = Math.ceil(maxScore * 0.6);
  }
  else if (text.includes('minimal') || text.includes('attempt')) {
    score = Math.ceil(maxScore * 0.3);
  }
  return clampScore(score, maxScore);
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/grade') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'POST /grade only' }));
    return;
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  }
  catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const maxScore = Number(payload.maxScore) || 1;
  const score = scoreFromRubric(payload.rubric, maxScore);
  const response = {
    score,
    maxScore,
    feedback: `Mock grader: awarded ${score}/${maxScore} points.`,
    confidence: 0.75
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
});

server.listen(PORT, () => {
  console.log(`Mock AI grader listening on http://localhost:${PORT}/grade`);
});
