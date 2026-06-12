# H5P.Paint

Open-ended **drawing question type** for [H5P](https://h5p.org). The author writes
a prompt (and optionally provides a background and a reference image), the
learner draws on a Fabric.js canvas, and on submit the drawing is attached
to an xAPI statement so a teacher or LRS can review it.

Inspired by Oliver Tacke's [Idea Portfolio](https://otacke.h5p.com/content/1292739566032969277)
entry _Paint_ ("a content type to create some doodles and store them — might
be interesting to wrap images in xAPI") and the related _H5P Freehand
Exercise_ idea.

## Features

- Built on `H5P.Question`, so it integrates with Question Set, Course
  Presentation, Interactive Book, and any other H5P container that accepts
  question types.
- Fabric.js canvas with **pencil**, **brush**, **eraser**, **line**,
  **rectangle**, **ellipse**, **text**, **color picker**, **brush size**,
  **undo / redo**, and **clear**.
- Optional **background image** (e.g. graph paper, photo to annotate, outline
  to trace) and optional **reference / solution image** revealed via
  _Show solution_.
- Saves and restores learner progress through the standard H5P
  `getCurrentState` / `setCurrentState` mechanism.
- Manual / teacher scoring: no auto-grading. The drawing PNG is sent as an
  xAPI attachment (`usageType: http://h5p.org/x-content-types/H5P.Paint/drawing`)
  with `length` and `sha2` metadata so an LRS can persist the file.
- Accessible toolbar (`role="toolbar"` with arrow-key navigation,
  `aria-pressed` per tool, ARIA-labelled inputs, high-contrast and
  reduced-motion media-query support).

## Authoring

| Field | Purpose |
| ----- | ------- |
| `taskDescription` | HTML prompt rendered above the canvas. |
| `media.backgroundImage` | Optional image painted behind the learner's drawing. |
| `media.referenceImage` | Optional image revealed via _Show solution_. |
| `media.alternativeText` | Screen-reader description of the canvas. |
| `canvas.width` / `canvas.aspectRatio` | Base size of the drawing surface. |
| `canvas.tools` | Subset of tools to expose in the toolbar. |
| `canvas.defaultColor` / `canvas.defaultBrushSize` | Toolbar defaults. |
| `behaviour.enableSubmit` / `enableSolution` / `enableRetry` | Show / hide buttons. |
| `behaviour.lockAfterSubmit` | Freeze the canvas after submit until retry. |
| `behaviour.maxScore` | Maximum points a tutor can award (learner score stays 0 until evaluated). |

All UI strings are translatable via the `l10n` and `a11y` groups in `semantics.json`.

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

## LMS / platform integration

H5P.Paint is designed for **manual evaluation**: the learner drawing is captured
at submit time and a tutor or host platform assigns the final score.

### Scoring contract

| Method | Value | Meaning |
| ------ | ----- | ------- |
| `getScore()` | `0` | No auto-grading; earned points come from host evaluation |
| `getMaxScore()` | `behaviour.maxScore` | Author-configured cap for tutor scoring |
| `getAnswerGiven()` | `boolean` | Whether the canvas has at least one object |
| `getCurrentState()` | Fabric JSON + `submitted` flag | Resume / persistence payload |

### Submit payload (host enrichment)

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

Requires Node.js 18+.

```bash
npm install
npm run watch       # rebuild on change
npm run build       # production build
npm run lint
```

The build emits `dist/h5p-paint.js` and `dist/h5p-paint.css`, which are the two
files referenced from `library.json`.

### Producing a `.h5p` package

If you have the [H5P CLI](https://h5p.org/h5p-cli-guide):

```bash
npm run build
h5p pack . H5P.Paint.h5p
```

Or, with plain `zip`:

```bash
npm run build
zip -rq H5P.Paint.h5p . \
  -x "node_modules/*" "src/*" ".git/*" "*.h5p" \
     "package.json" "package-lock.json" "webpack.config.js" \
     ".eslintrc.json" ".babelrc" ".editorconfig" ".gitignore" \
     "README.md"
```

Upload the resulting `.h5p` file to any H5P-enabled platform that allows
library installation.

## Repository layout

```text
.
|-- library.json           # Library manifest
|-- semantics.json         # Authoring fields
|-- icon.svg               # H5P Hub icon
|-- LICENSE                # MIT license for this library
|-- NOTICE                 # Third-party attributions (Fabric.js, H5P deps)
|-- language/en.json       # Editor translations (English)
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

## Limitations / out of scope (v0.1)

- No auto-grading. Open-ended drawings are reviewed manually via xAPI.
- No collaborative / multiplayer drawing.
- The drawing PNG is sent as a `data:` URL; very large canvases will produce
  large statements. LRSs may impose attachment-size limits.
- Pressure-sensitive stylus input is not specifically tuned (basic pointer
  events only).

## License

H5P.Paint is released under the [MIT License](LICENSE).

Third-party components (including Fabric.js bundled into `dist/h5p-paint.js` and
runtime H5P dependencies) are listed in [NOTICE](NOTICE) with copyright and
license information.
