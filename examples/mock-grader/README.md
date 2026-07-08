# Mock AI grader

Minimal HTTP server for testing H5P.Paint **AI scoring mode** locally.

## Run

From the repository root:

```bash
npm run mock-grader
```

Or directly:

```bash
node examples/mock-grader/server.mjs
```

Listens on **http://localhost:3000/grade** (override with `PORT=4000`).

## Configure Paint content

In the H5P editor, set:

- **Scoring mode** → AI
- **Grading endpoint URL** → `http://localhost:3000/grade`

Or use [`../content-ai.json`](../content-ai.json) and set `behaviour.aiGrading.endpointUrl`.

**Note:** Browsers block mixed content if your H5P host is HTTPS and the grader is HTTP. For local testing, use an HTTP host (e.g. Lumi dev) or a host hook instead:

```javascript
H5PIntegration.paintAiGrader = {
  grade: async function (payload) {
    return { score: 4, feedback: 'Looks good.', confidence: 0.8 };
  }
};
```

## Request / response

See [`../ai-grading-contract.md`](../ai-grading-contract.md).

The mock server returns a score derived from rubric keywords (`excellent`, `partial`, `minimal`, etc.) or `MOCK_SCORE` (default 4).
