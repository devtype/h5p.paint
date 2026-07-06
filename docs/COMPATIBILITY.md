# H5P.Paint compatibility checklist

Manual QA matrix for verifying H5P.Paint on a **stock H5P host** (no custom
`setFinished` patches). Use the packaged library from `npm run pack` or a GitHub
release asset.

## Test environment

| Field | Value |
| ----- | ----- |
| Library version | 0.6.1 |
| Host | _Record: Lumi / Drupal+H5P / Moodle / other_ |
| Browser | _Record: Chrome / Firefox / Safari / iOS Safari_ |
| Date | _Record when tested_ |
| Tester | _Name_ |

## Browser matrix (recommended)

| Browser | Version | Result |
| ------- | ------- | ------ |
| Chrome (desktop) | | ☐ Pass ☐ Fail |
| Firefox (desktop) | | ☐ Pass ☐ Fail |
| Safari (desktop) | | ☐ Pass ☐ Fail |
| Safari (iOS) | | ☐ Pass ☐ Fail |

## Standalone content

| # | Scenario | Expected | Result |
| - | -------- | -------- | ------ |
| 1 | Load standalone Paint content | Canvas, toolbar, task description render | ☐ |
| 2 | Draw with pencil and submit | Submit succeeds; canvas locks if configured | ☐ |
| 3 | Submit with empty canvas | Blocked; “no drawing” message | ☐ |
| 4 | Retry after submit | Canvas clears; submit button returns | ☐ |
| 5 | Show / hide solution (with reference image) | Reference overlay toggles | ☐ |
| 6 | Reload page mid-draw (save state enabled) | Drawing restored from `getCurrentState` | ☐ |
| 7 | Reload after submit | Submitted state restored; canvas locked | ☐ |
| 8 | Upgrade from 0.5.x saved drawing | Drawing saved under Fabric 5 reloads after 0.6.0 upgrade | ☐ |
| 8a | Author tool checkboxes | Editor shows per-tool checkboxes; learner toolbar matches selection; initial tool is first enabled drawing tool | ☐ |

## Question Set integration

| # | Scenario | Expected | Result |
| - | -------- | -------- | ------ |
| 9 | Paint as one question in Question Set | Renders inside QS navigation | ☐ |
| 10 | Submit Paint, go to next question | No console errors; state saved | ☐ |
| 11 | Return to Paint question | Prior drawing visible | ☐ |
| 12 | **Manual scoring** (`scoringMode: manual`) | Score bar shows 0 after submit | ☐ |
| 13 | **Completion scoring** (`scoringMode: completion`) | Full score after submit with drawing | ☐ |
| 14 | Completion + retry | Score resets to 0 until resubmit | ☐ |
| 15 | **AI scoring** (`scoringMode: ai`) | Grading message, then score from endpoint/hook | ☐ |
| 16 | AI + reload after graded submit | Score and feedback restored from state | ☐ |
| 17 | AI + reload during grading (pending) | Drawing restored; interrupted message; submit available; score 0 until resubmit | ☐ |
| 18 | AI grading failure + `onFailure: zero` | Score 0, error message shown | ☐ |
| 19 | AI + `showConfidenceToLearner` | Confidence percentage shown when grader returns it | ☐ |
| 20 | Finish Question Set | xAPI / completion events fire | ☐ |

## Container embeds (smoke test)

| # | Scenario | Expected | Result |
| - | --------- | -------- | ------ |
| 21 | Interactive Book | Paint page renders and submit works | ☐ |
| 22 | Course Presentation | Paint slide renders and submit works | ☐ |

## xAPI (optional LRS host)

| # | Scenario | Expected | Result |
| - | -------- | -------- | ------ |
| 23 | Submit drawing | `answered` verb; PNG attachment present | ☐ |
| 24 | Completion mode submit | `result.score.raw` equals `maxScore` | ☐ |
| 25 | AI mode submit | `result.score` matches grader; feedback in response | ☐ |
| 26 | AI mode + confidence | `result.response` includes `confidence:` when returned | ☐ |
| 27 | Manual mode submit | No `result.score` in statement | ☐ |

## Mobile / touch

| # | Scenario | Expected | Result |
| - | -------- | -------- | ------ |
| 28 | Toolbar on narrow viewport | Horizontal scroll; buttons ≥ 44px | ☐ |
| 29 | Draw with finger / stylus | Strokes register; no page scroll while drawing | ☐ |

## Notes
File issues at https://github.com/devtype/h5p.paint/issues.

For privacy and data-processing obligations (AI scoring, xAPI PNG exports), see
[`docs/PRIVACY.md`](PRIVACY.md).

## Automated checks (CI)

These run on every push via GitHub Actions:

- `npm run lint`
- `npm run build`
- `npm test` (export compositing, AI grader, scoring, Fabric state, and tool-config tests)

Manual rows above are **not** automated and must be signed off before claiming
full compatibility on a specific host.
