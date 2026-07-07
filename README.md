# H5P.Paint

Open-ended **drawing question type** for [H5P](https://h5p.org). The author writes
a prompt (and optionally provides a background and a reference image), the
learner draws on a Fabric.js canvas, and on submit the drawing is attached
to an xAPI statement so a teacher or LRS can review it.

Inspired by Oliver Tacke's [Idea Portfolio](https://otacke.h5p.com/content/1292739566032969277)
entry _Paint_ ("a content type to create some doodles and store them — might
be interesting to wrap images in xAPI") and the related _H5P Freehand
Exercise_ idea.

H5P.Paint is developed by **devtype**. It is not affiliated with, endorsed by,
or maintained by H5P Group AS.

## Features

- Built on `H5P.Question`, so it integrates with Question Set, Course
  Presentation, Interactive Book, and any other H5P container that accepts
  question types.
- Fabric.js canvas with **pencil**, **brush**, **eraser**, **line**,
  **rectangle**, **ellipse**, **text**, **color picker**, **brush size**,
  **undo / redo**, and **clear**.
- Optional **background** — solid color (default white) or **background image**
  (e.g. graph paper, photo to annotate, outline to trace) — and optional
  **reference / solution image** revealed via _Show solution_.
- **Eraser** removes learner drawing only; the authored background image or
  color shows through again (does not paint over the background).
- Saves and restores learner progress through the standard H5P
  `getCurrentState` / `setCurrentState` mechanism.
- **Scoring modes:** manual evaluation (default), **completion** scoring, or
  **AI** scoring via a configurable endpoint or host hook.
- The drawing PNG is sent as an xAPI attachment
  (`usageType: http://h5p.org/x-content-types/H5P.Paint/drawing`) with `length`
  and `sha2` metadata so an LRS can persist the file.
- Accessible toolbar (`role="toolbar"` with arrow-key navigation,
  `aria-pressed` per tool, ARIA-labelled inputs, high-contrast and
  reduced-motion media-query support).

## Authoring

| Field | Purpose |
| ----- | ------- |
| `taskDescription` | HTML prompt rendered above the canvas. |
| `canvas.background.type` | `color` (default) or `image`. |
| `canvas.background.color` | Solid background color when type is `color` (default `#ffffff`). |
| `canvas.background.image` | Background image when type is `image`. |
| `media.referenceImage` | Optional image revealed via _Show solution_. |
| `media.alternativeText` | Screen-reader description of the canvas. |
| `canvas.width` / `canvas.aspectRatio` | Base size of the drawing surface. |
| `canvas.tools` | Per-tool checkboxes in the editor (`pencil`, `brush`, `eraser`, `line`, `rect`, `ellipse`, `text`, `color`, `size`, `undo`, `redo`, `clear`). Only checked tools appear in the learner toolbar. Legacy JSON arrays are still accepted at runtime. When color or size are unchecked, learners use `canvas.brushDefaults` instead. See [`examples/content-blank.json`](examples/content-blank.json). |
| `canvas.brushDefaults.defaultColor` / `canvas.brushDefaults.defaultBrushSize` | Toolbar defaults. |
| `behaviour.enableSubmit` / `enableSolution` / `enableRetry` | Show / hide buttons. |
| `behaviour.lockAfterSubmit` | Freeze the canvas after submit until retry. |
| `behaviour.scoringMode` | `manual` (default), `completion`, or `ai` — see [Scoring contract](#scoring-contract). |
| `behaviour.aiGrading` | AI endpoint, rubric, timeout, `maxExportWidth`, failure policy, feedback/confidence toggles (visible when scoring mode is AI). |
| `behaviour.maxScore` | Maximum points for the question. |

**Legacy content:** packages that still use `media.backgroundImage`,
`canvas.backgroundColor`, flat `canvas.defaultColor` / `canvas.defaultBrushSize`,
or a `canvas.tools` **string array** (pre-0.6.1) are mapped automatically at
runtime to the new model.

All UI strings are translatable via the `l10n` and `a11y` groups in `semantics.json`.
Editor form labels are provided in [`language/en.json`](language/en.json),
[`language/de.json`](language/de.json), and [`language/fr.json`](language/fr.json).
German and French defaults for learner-facing strings are included for new
content created in those editor locales.

**Editor note:** H5P replaces a group header with the first visible text field's
value when a group contains multiple text fields. Brush defaults live in their
own nested group so the canvas section keeps its proper title.

## xAPI

When the learner submits a drawing, the content type triggers an `answered`
statement:

```jsonc
{
  "verb": { "id": "http://adlnet.gov/expapi/verbs/answered" },
  "object": {
    "definition": {
      "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
      "interactionType": "other",
      "name":        { "en-US": "<content title>" },
      "description": { "en-US": "<task description, plain text>" }
    }
  },
  "result": {
    "completion": true,
    "response": "drawing:<N>objects,<W>x<H>"
  },
  "attachments": [
    {
      "usageType":   "http://h5p.org/x-content-types/H5P.Paint/drawing",
      "display":     { "en-US": "Learner drawing" },
      "contentType": "image/png",
      "length":      <bytes>,
      "sha2":        "<sha-256 hex>",
      "fileUrl":     "data:image/png;base64,..."
    }
  ]
}
```

LRSs that don't accept attachments still get the verb and `result.response`.

When `behaviour.scoringMode` is `completion`, the statement also includes
`result.score` with `raw`, `max`, and `scaled` after a valid submit.

## Quick start

1. **Install the library** — download `H5P.Paint.h5p` from
   [GitHub Releases](https://github.com/devtype/h5p.paint/releases) or run
   `npm run pack` locally, then upload the file in your H5P admin UI
   (Drupal, Moodle, WordPress, Lumi, etc.).
2. **Create content** — add a new **Paint** activity, write the task
   description, and configure canvas options.
3. **Embed in a question flow** — add the Paint content to a **Question Set**
   (or use it standalone). Test submit, retry, and resume.

Example content payloads live in [`examples/`](examples/) (`content.json`,
`content-blank.json`, `content-annotate.json`, `content-reference.json`,
`content-ai.json`).

H5P Hub listing is optional and not required to use this library.

## Generic host integration

These work **out of the box** on any H5P host with no custom code:

| Capability | H5P API |
| ---------- | ------- |
| Submit / retry / show solution buttons | `H5P.Question` |
| Resume learner progress | `getCurrentState()` / `previousState` |
| xAPI on submit | `answered` verb + PNG attachment |
| Question Set score bar | `getScore()` / `getMaxScore()` |

**Optional host enrichment** (not H5P core): some platforms add a `dataUrl` PNG
field to the `setFinished` details payload by calling
`question.paintCanvas.exportPNG()`. This is useful for file storage and tutor
review but is **not required** for standalone H5P use.

See [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) for a manual QA checklist
(Question Set, containers, mobile, xAPI).

## LMS / platform integration

H5P.Paint supports **manual evaluation** (default), **completion** scoring, and
**AI** scoring for generic Question Set / LRS hosts.

### Scoring contract

| Setting | `getScore()` after submit | xAPI `result.score` | Typical use |
| ------- | ------------------------- | ------------------- | ----------- |
| `scoringMode: manual` (default) | `0` | omitted | Tutor/LMS evaluates drawing |
| `scoringMode: completion` | `maxScore` (if drawing non-empty) | `{ raw, max, scaled }` | Auto points in Question Set |
| `scoringMode: ai` | AI score when grading completes | `{ raw, max, scaled }` + feedback/confidence in `result.response` | Vision model / custom grader |

| Method | Meaning |
| ------ | ------- |
| `getMaxScore()` | `behaviour.maxScore` |
| `getAnswerGiven()` | Whether the canvas has at least one object |
| `getCurrentState()` | Fabric JSON + `submitted` + optional AI fields (v2, incl. confidence) |

Platforms with tutor evaluation should keep **`scoringMode: manual`**.

### AI grading

Configure `behaviour.aiGrading.endpointUrl` or provide a host hook:

```javascript
H5PIntegration.paintAiGrader = {
  grade: async function (payload) {
    return { score: 4, feedback: 'Well labelled.' };
  }
};
```

The hook takes precedence over the endpoint URL. **Never store API keys in H5P
content.** Use a same-origin proxy or the hook for authentication.

Request/response format: [`examples/ai-grading-contract.md`](examples/ai-grading-contract.md).
Example AI content preset: [`examples/content-ai.json`](examples/content-ai.json)
(set `endpointUrl` or use the host hook below).

**Data protection:** AI mode may transmit learner drawings and task text to an
external service. Authors and platform operators are responsible for privacy
compliance. See [`docs/PRIVACY.md`](docs/PRIVACY.md).

On submit, AI mode shows a grading progress message, calls the grader
asynchronously, then sets the score and optional learner feedback. PNGs sent
to the grader are downscaled to `behaviour.aiGrading.maxExportWidth` (default
1024px). Optional `confidence` from the grader can be shown when
`showConfidenceToLearner` is enabled. If the learner reloads during grading,
the drawing is restored and they are prompted to submit again. If grading
fails, `behaviour.aiGrading.onFailure` controls the fallback (`zero`,
`completion`, or `manual`).

### Submit payload (optional host enrichment)

When wiring `H5PIntegration.ajax.setFinished` (or equivalent), hosts typically
POST JSON **details** shaped like:

```jsonc
{
  "library": "H5P.Paint",
  "score": 0,
  "maxScore": 1,
  "started": 1710000000,
  "finished": 1710000123,
  "answer": { "v": 1, "json": { /* Fabric scene */ }, "submitted": true },
  "dataUrl": "data:image/png;base64,..."   // optional; host may add via exportPNG()
}
```

- **`answer`** — from `getCurrentState()`; vector scene for restore/review
- **`dataUrl`** — PNG rasterization; not part of H5P core but commonly added by
  the host from `paintCanvas.exportPNG()` for file storage
- **`maxScore`** — mirrors `getMaxScore()` for audit and server-side validation

### xAPI attachment

The content type also attaches the PNG to the xAPI `answered` statement
(`usageType: http://h5p.org/x-content-types/H5P.Paint/drawing`). LRS hosts can
persist from xAPI; LMS hosts may prefer the `setFinished` details payload.

### Resume

Learner progress is restored via H5P user data and `getCurrentState()` /
`previousState`. Hosts should not rely on xAPI attachments for resume.

## Development

Requires Node.js **20+** for development (Fabric 7 dependency chain). H5P hosts
only need the built `.h5p` package.

```bash
npm install
npm run watch       # rebuild on change
npm run build       # production build
npm run lint
npm test            # unit tests (export, AI grader, scoring)
npm run pack        # build + create H5P.Paint.h5p
```

The build emits `dist/h5p-paint.js` and `dist/h5p-paint.css`, which are the two
files referenced from `library.json`.

### Build size

After `npm run build` (production, minified):

| Artifact | Typical size |
| -------- | ------------ |
| `dist/h5p-paint.js` | ~313 KB (Fabric.js is the bulk) |
| `dist/h5p-paint.css` | ~3.5 KB |
| `H5P.Paint.h5p` (`npm run pack`) | ~110 KB (runtime allowlist only) |

The webpack bundle includes Fabric.js; H5P platform libraries (`H5P.Question`,
etc.) are not bundled.

### Producing a `.h5p` package

```bash
npm run pack
```

This runs `build` and creates `H5P.Paint.h5p` in the project root (respecting
[`.h5pignore`](.h5pignore)).

Alternatively, with the [H5P CLI](https://h5p.org/h5p-cli-guide):

```bash
npm run build
h5p pack . H5P.Paint.h5p
```

Upload the resulting `.h5p` file to any H5P-enabled platform that allows
library installation.

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Repository layout

```text
.
|-- library.json           # Library manifest
|-- semantics.json         # Authoring fields
|-- icon.svg               # H5P Hub icon
|-- LICENSE                # MIT license for this library
|-- NOTICE                 # Third-party attributions (Fabric.js, H5P deps)
|-- language/en.json       # Editor translations (English)
|-- language/de.json       # Editor translations (German) + learner UI defaults
|-- language/fr.json       # Editor translations (French) + learner UI defaults
|-- docs/COMPATIBILITY.md  # Manual QA checklist for generic H5P hosts
|-- CHANGELOG.md           # Version history
|-- examples/              # Demo content JSON presets
|-- src/
|   |-- entries/dist.js                  # Webpack entry, registers H5P.Paint
|   |-- scripts/
|   |   |-- h5p-paint.js                 # Main class extending H5P.Question
|   |   |-- canvas/paint-canvas.js       # Fabric.js wrapper
|   |   |-- canvas/tools.js              # Tool definitions and brushes
|   |   |-- ui/toolbar.js                # Accessible toolbar
|   |   |-- ui/solution-overlay.js       # Reference image overlay
|   |   |-- services/state.js            # getCurrentState / setCurrentState
|   |   `-- services/xapi.js             # xAPI verb + PNG attachment
|   `-- styles/h5p-paint.scss
`-- dist/                                # webpack build output
```

## Limitations / out of scope

- No pixel-matching auto-grading. Optional **completion** scoring awards full
  points for any non-empty submitted drawing. **AI** scoring requires a host
  endpoint or `H5PIntegration.paintAiGrader` hook.
- No collaborative / multiplayer drawing.
- The drawing PNG is sent as a `data:` URL; very large canvases will produce
  large statements. LRSs may impose attachment-size limits. Keep `canvas.width`
  reasonable (see semantics description).
- Pressure-sensitive stylus input is not specifically tuned (basic pointer
  events only).

## License

H5P.Paint is released under the [MIT License](LICENSE). Copyright (c) 2026
**devtype**.

Third-party components (including Fabric.js bundled into `dist/h5p-paint.js` and
runtime H5P dependencies) are listed in [NOTICE](NOTICE) with copyright and
license information.
