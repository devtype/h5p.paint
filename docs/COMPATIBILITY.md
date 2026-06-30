# H5P.Paint compatibility checklist

Manual QA matrix for verifying H5P.Paint on a **stock H5P host** (no custom
`setFinished` patches). Use the packaged library from `npm run pack` or a GitHub
release asset.

## Test environment

| Field | Value |
| ----- | ----- |
| Library version | 0.4.0 |
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

## Question Set integration

| # | Scenario | Expected | Result |
| - | -------- | -------- | ------ |
| 8 | Paint as one question in Question Set | Renders inside QS navigation | ☐ |
| 9 | Submit Paint, go to next question | No console errors; state saved | ☐ |
| 10 | Return to Paint question | Prior drawing visible | ☐ |
| 11 | **Manual scoring** (`scoringMode: manual`) | Score bar shows 0 after submit | ☐ |
| 12 | **Completion scoring** (`scoringMode: completion`) | Full score after submit with drawing | ☐ |
| 13 | Completion + retry | Score resets to 0 until resubmit | ☐ |
| 14 | **AI scoring** (`scoringMode: ai`) | Grading message, then score from endpoint/hook | ☐ |
| 15 | AI + reload after graded submit | Score and feedback restored from state | ☐ |
| 16 | AI grading failure + `onFailure: zero` | Score 0, error message shown | ☐ |
| 17 | Finish Question Set | xAPI / completion events fire | ☐ |

## Container embeds (smoke test)

| # | Scenario | Expected | Result |
| - | --------- | -------- | ------ |
| 18 | Interactive Book | Paint page renders and submit works | ☐ |
| 19 | Course Presentation | Paint slide renders and submit works | ☐ |

## xAPI (optional LRS host)

| # | Scenario | Expected | Result |
| - | -------- | -------- | ------ |
| 20 | Submit drawing | `answered` verb; PNG attachment present | ☐ |
| 21 | Completion mode submit | `result.score.raw` equals `maxScore` | ☐ |
| 22 | AI mode submit | `result.score` matches grader; feedback in response | ☐ |
| 23 | Manual mode submit | No `result.score` in statement | ☐ |

## Mobile / touch

| # | Scenario | Expected | Result |
| - | -------- | -------- | ------ |
| 24 | Toolbar on narrow viewport | Horizontal scroll; buttons ≥ 44px | ☐ |
| 25 | Draw with finger / stylus | Strokes register; no page scroll while drawing | ☐ |

## Notes
File issues at https://github.com/devtype/h5p.paint/issues.

## Automated checks (CI)

These run on every push via GitHub Actions:

- `npm run lint`
- `npm run build`
- `npm test` (export compositing and AI grader unit tests)

Manual rows above are **not** automated and must be signed off before claiming
full compatibility on a specific host.
