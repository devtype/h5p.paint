# AI grading endpoint contract

When `behaviour.scoringMode` is `ai`, H5P.Paint POSTs JSON to
`behaviour.aiGrading.endpointUrl` unless the host provides
`H5PIntegration.paintAiGrader.grade(payload)`.

## Request

```json
{
  "library": "H5P.Paint",
  "contentId": 123,
  "maxScore": 5,
  "taskDescription": "Plain text task prompt",
  "rubric": "Optional grading criteria",
  "drawing": {
    "dataUrl": "data:image/png;base64,...",
    "summary": "drawing:3objects,800x600"
  },
  "referenceImageUrl": "https://example.com/ref.png"
}
```

The PNG may be downscaled to `behaviour.aiGrading.maxExportWidth` pixels wide
(default **1024**) before sending.

## Response

```json
{
  "score": 3,
  "maxScore": 5,
  "feedback": "Good effort labelling the diagram.",
  "confidence": 0.82
}
```

- `score` (required) — integer or float, clamped to `[0, maxScore]`
- `feedback` (optional) — short learner-facing comment (HTML stripped)
- `confidence` (optional) — float in `[0, 1]`; persisted in learner state,
  optionally shown when `showConfidenceToLearner` is enabled, and appended to
  xAPI `result.response` as `; confidence:0.82`

## Host hook (optional)

```javascript
H5PIntegration.paintAiGrader = {
  grade: async function (payload) {
    // Call your backend / vision model
    return { score: 4, feedback: 'Well done.', confidence: 0.91 };
  }
};
```

When the hook is present, `endpointUrl` is ignored. Never store API keys in
H5P content parameters.

## Interrupted grading

If the learner reloads or navigates away while grading is in progress
(`aiGradingStatus: pending`, not yet submitted), the library restores the
drawing but resets grading to idle and prompts the learner to submit again.
xAPI is emitted only after grading completes or fails and the submit is
finalized.
