# Changelog

All notable changes to H5P.Paint are documented here. Version numbers follow
[`library.json`](library.json) (`majorVersion.minorVersion.patchVersion`).

## [0.5.1] - 2026-06-30

### Added

- [`docs/PRIVACY.md`](docs/PRIVACY.md) — data-processing guidance for authors,
  LMS admins, and integrators (AI scoring, xAPI PNG exports).
- Editor privacy description on `behaviour.aiGrading.endpointUrl` (semantics +
  en/de/fr/nl/es translations).

### Changed

- Copyright and `library.json` author set to **devtype**; README trademark
  disclaimer added (not affiliated with H5P Group AS).
- [`NOTICE`](NOTICE) extended with `H5PEditor.ShowWhen` and
  `H5PEditor.ColorSelector` editor dependencies.

## [0.5.0] - 2026-06-13

### Added

- **AI confidence** — optional `confidence` from grader persisted in state,
  optionally shown to learners (`showConfidenceToLearner`), encoded in xAPI
  `result.response`.
- **`behaviour.aiGrading.maxExportWidth`** — author-configurable PNG downscale
  before grading requests (default 1024px).
- **`examples/content-ai.json`** — AI scoring preset with rubric.
- Pure **`scoring.js`** module with unit tests for score resolution, xAPI
  inclusion, and interrupted grading restore.
- Editor translations: **Dutch** ([`language/nl.json`](language/nl.json)) and
  **Spanish** ([`language/es.json`](language/es.json)).

### Fixed

- Reload during AI grading (`pending`, not submitted) no longer leaves the
  learner stuck without a submit button; shows an interrupted message instead.

## [0.4.0] - 2026-06-25

### Added

- **AI scoring mode** (`behaviour.scoringMode: ai`) — async grading via author
  endpoint URL or `H5PIntegration.paintAiGrader.grade()` hook.
- `behaviour.aiGrading` settings: endpoint, rubric, timeout, failure policy,
  learner feedback toggle.
- Learner UI for grading progress and AI feedback.
- State v2 persistence for AI score and feedback on resume.
- [`examples/ai-grading-contract.md`](examples/ai-grading-contract.md) —
  request/response contract for grading endpoints.

## [0.3.1] - 2026-06-25

### Fixed

- Color picker fields showed `[field:text:colorSelector:…]` when
  `H5PEditor.ColorSelector` 1.3 was installed but the library declared dependency
  on 1.0. Editor dependency updated to 1.3.
- Background color field now uses `showWhen` with nested `colorSelector` per
  H5PEditor.ShowWhen documentation (conditional color fields).

## [0.3.0] - 2026-06-13

### Added

- Optional **completion scoring** via `behaviour.scoringMode` (`manual` default,
  `completion` awards full `maxScore` when the learner submits a non-empty
  drawing). xAPI `result.score` is set in completion mode.
- **Color picker widget** (`H5PEditor.ColorSelector`) for background and brush
  default colors in the editor.
- French editor translations ([`language/fr.json`](language/fr.json)).
- `npm run pack` script to produce `H5P.Paint.h5p`.
- `npm test` — export compositing unit tests.
- GitHub Actions CI (lint, build, test) and release workflow (`.h5p` artifact).
- Demo content presets under [`examples/`](examples/).
- [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) — generic H5P QA checklist.
- README quick start and generic host integration sections.

### Changed

- Mobile toolbar: 44×44px minimum touch targets, horizontal scroll on narrow
  viewports.
- Canvas width semantics description warns about large PNG / xAPI payload sizes.
- Library description updated for optional completion scoring.

### Fixed

- (Carried forward from 0.2.x) Eraser no longer paints over background images.
- (Carried forward from 0.2.x) `exportPNG()` handles zero-size Fabric layers.

## [0.2.9] - 2026-06-13

### Added

- German editor translations and learner UI defaults ([`language/de.json`](language/de.json)).

### Changed

- Nested `canvas.brushDefaults` group fixes H5P editor section title showing hex
  color instead of "Canvas options".
- `resolveBrushDefaults()` preserves backwards compatibility with flat
  `canvas.defaultColor` / `canvas.defaultBrushSize`.

## [0.2.8] - 2026-06-12

### Fixed

- `exportPNG()` uses `toCanvasElement(1, { width, height })` and skips
  `drawImage` when the Fabric layer is 0×0 (fixes missing submissions on
  Question Set "Next").

## [0.2.4] - 2026-06-11

### Fixed

- Background image on a separate HTML layer; eraser reveals background instead
  of painting white over it.

## [0.2.0] - 2026-06-10

### Added

- Explicit background type (color or image) in semantics.
- `behaviour.maxScore` and `getMaxScore()` for manual evaluation hosts.
- [`NOTICE`](NOTICE) third-party license file.

[0.3.0]: https://github.com/devtype/h5p.paint/compare/v0.2.9...v0.3.0
[0.2.9]: https://github.com/devtype/h5p.paint/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/devtype/h5p.paint/compare/v0.2.4...v0.2.8
[0.2.4]: https://github.com/devtype/h5p.paint/compare/v0.2.0...v0.2.4
[0.2.0]: https://github.com/devtype/h5p.paint/releases/tag/v0.2.0
