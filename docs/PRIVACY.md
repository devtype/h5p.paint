# Privacy and data processing (H5P.Paint)

Guidance for **content authors, LMS administrators, and integrators** who deploy
H5P.Paint. This document is practical orientation only — not legal advice.
Consult qualified counsel for your jurisdiction and use case.

## What data is processed

When learners use a Paint activity, the following may be created or transmitted:

| Data | Where it goes |
| ---- | ------------- |
| Fabric scene JSON | Host via `getCurrentState()` / user data (resume) |
| PNG raster export | xAPI attachment on submit; optional host `dataUrl`; AI grading payload |
| Task description, rubric | Included in AI grading requests when `scoringMode: ai` |
| Reference image URL | Optional field in AI grading requests when configured |

Drawings may contain **personal data** (e.g. names, faces, identifiable content)
even when the activity does not ask for them explicitly.

## Who is responsible

- The **host platform** (LMS, Drupal, etc.) and **content author** are typically
  the **data controllers** for learner data.
- **devtype** provides the H5P.Paint library only. It does not operate grading
  servers, store learner submissions, or receive data from production deployments.

## AI scoring (`scoringMode: ai`)

When AI scoring is enabled:

1. On submit, the learner drawing (PNG) and task metadata may be sent to:
   - `behaviour.aiGrading.endpointUrl` (author-configured), or
   - `H5PIntegration.paintAiGrader.grade()` (host-provided hook).

2. **Do not store API keys or secrets** in H5P content parameters. Use a
   same-origin proxy or the host hook for authentication.

3. Before enabling AI scoring in production, ensure you have:
   - A **legal basis** for processing (e.g. consent, legitimate interest,
     performance of a contract — depends on jurisdiction).
   - An updated **privacy notice** informing learners that drawings may be
     processed by an automated service.
   - A **data processing agreement (DPA)** with third-party AI vendors where
     required (e.g. GDPR Article 28).
   - Appropriate **retention and deletion** policies for graded submissions.

4. **Minimize exposure:** prefer a host-controlled proxy or hook over embedding
   third-party URLs directly in shared content JSON.

See also [`examples/ai-grading-contract.md`](../examples/ai-grading-contract.md).

## xAPI and LRS

On submit, H5P.Paint attaches the learner drawing as a PNG to the xAPI
`answered` statement (`usageType: http://h5p.org/x-content-types/H5P.Paint/drawing`).

- LRS hosts must apply their own retention, access control, and privacy policies.
- AI feedback and optional confidence values may appear in `result.response`.

## Data minimization

Authors can reduce payload size and processing scope by:

- Keeping `canvas.width` reasonable (see semantics description).
- Setting `behaviour.aiGrading.maxExportWidth` lower when full resolution is not
  needed for grading.
- Using **manual** or **completion** scoring when human review is required and
  automated processing is not justified.

## Questions

File issues at https://github.com/devtype/h5p.paint/issues.
