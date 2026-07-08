# H5P.Paint quickstart

Get H5P.Paint running on a stock H5P host in a few steps.

## 1. Install the library

Download **H5P.Paint.h5p** from [GitHub Releases](https://github.com/devtype/h5p.paint/releases) or build locally:

```bash
npm install
npm run pack
```

Upload `H5P.Paint.h5p` in your platform’s H5P library admin (Lumi, Moodle, Drupal, WordPress, etc.).

## 2. Create Paint content

1. Add new content → **Paint**
2. Write the **task description** (HTML prompt above the canvas)
3. Under **Canvas options**:
   - Set width / aspect ratio
   - Choose a **tool preset** (Full toolkit, Sketch only, Annotate, Shapes and text, or Custom)
   - Set **default active tool** (e.g. Pencil)
   - Optional: under **Brush defaults**, set **Learner color selection** to **Limited palette** or **Fixed color only** for simpler UIs (younger learners)
   - Optional: background image for annotate/trace tasks
4. Under **Behavioural settings**: enable submit / retry / solution as needed

Example JSON presets: [`examples/`](../examples/) (`content-blank.json` = sketch preset, `content-reference.json` = custom tools).

## 3. Embed in Question Set

1. Create or edit **Question Set**
2. Add a question → select your Paint content
3. Publish and preview

Verify: draw → submit → navigate to next question → return → drawing still visible.

## 4. Test resume and retry

- Draw without submitting → reload page → drawing should restore (host user data)
- Submit → retry (if enabled) → canvas clears and submit returns

See [`COMPATIBILITY.md`](COMPATIBILITY.md) for a full manual QA matrix.

## 5. Optional — AI scoring

**Option A — host hook (recommended for production):**

```javascript
H5PIntegration.paintAiGrader = {
  grade: async function (payload) {
    // payload.drawing.dataUrl, payload.rubric, payload.maxScore, …
    return { score: 3, feedback: 'Well done.', confidence: 0.85 };
  }
};
```

**Option B — local mock server (development):**

```bash
npm run mock-grader
```

Set **Grading endpoint URL** to `http://localhost:3000/grade`. See [`examples/mock-grader/README.md`](../examples/mock-grader/README.md).

Contract details: [`examples/ai-grading-contract.md`](../examples/ai-grading-contract.md).

**Privacy:** AI mode may send learner drawings off-site. Read [`PRIVACY.md`](PRIVACY.md) before production use.

## Troubleshooting

| Issue | Check |
| ----- | ----- |
| Library not in editor | Re-upload `.h5p`; clear H5P library cache |
| Tools missing in toolbar | Tool preset / custom checkboxes in Canvas options |
| AI grading fails | CORS, HTTPS mixed content, or timeout — try host hook |
| Large xAPI payloads | Reduce `canvas.width`; PNG is attached on submit |

More detail: [`README.md`](../README.md).
