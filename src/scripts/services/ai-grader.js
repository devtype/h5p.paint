/**
 * AI grading helpers for H5P.Paint (provider-agnostic).
 *
 * Grading is resolved via H5PIntegration.paintAiGrader.grade() when present,
 * otherwise POST to behaviour.aiGrading.endpointUrl.
 */

const LIBRARY_NAME = 'H5P.Paint';
const MAX_EXPORT_WIDTH = 1024;

/**
 * Strip HTML tags from a string.
 *
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize learner-facing feedback for safe text display.
 *
 * @param {string|null|undefined} feedback
 * @returns {string}
 */
export function sanitizeFeedback(feedback) {
  if (feedback === null || feedback === undefined) {
    return '';
  }
  return String(feedback).replace(/<[^>]*>/g, '').trim();
}

/**
 * Clamp score to [0, maxScore].
 *
 * @param {number} score
 * @param {number} maxScore
 * @returns {number}
 */
export function clampScore(score, maxScore) {
  const max = Math.max(0, Math.floor(Number(maxScore) || 0));
  const raw = Number(score);
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(max, Math.round(raw)));
}

/**
 * Parse and validate a grading API response.
 *
 * @param {unknown} body
 * @param {number} maxScore
 * @returns {{ score: number, feedback: string, confidence: number|null }}
 */
export function parseGradingResponse(body, maxScore) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid grading response');
  }
  if (body.score === undefined || body.score === null) {
    throw new Error('Grading response missing score');
  }
  const responseMax = body.maxScore !== undefined
    ? Math.max(0, Math.floor(Number(body.maxScore) || 0))
    : maxScore;
  const score = clampScore(body.score, responseMax);
  const feedback = sanitizeFeedback(body.feedback);
  let confidence = null;
  if (body.confidence !== undefined && body.confidence !== null) {
    const c = Number(body.confidence);
    if (Number.isFinite(c)) {
      confidence = Math.max(0, Math.min(1, c));
    }
  }
  return { score, feedback, confidence };
}

/**
 * Resolve fallback score when AI grading fails.
 *
 * @param {string} onFailure - zero | completion | manual
 * @param {number} maxScore
 * @param {boolean} hasDrawing
 * @returns {number}
 */
export function resolveFailureScore(onFailure, maxScore, hasDrawing) {
  if (onFailure === 'completion' && hasDrawing) {
    return maxScore;
  }
  return 0;
}

/**
 * Build the grading request payload.
 *
 * @param {object} ctx
 * @returns {object}
 */
export function buildGradingPayload(ctx) {
  const ai = ctx.aiGrading || {};
  const payload = {
    library: LIBRARY_NAME,
    contentId: ctx.contentId,
    maxScore: ctx.maxScore,
    taskDescription: stripHtml(ctx.taskDescription),
    rubric: stripHtml(ai.rubric || ''),
    drawing: {
      dataUrl: ctx.dataUrl,
      summary: ctx.summary || 'drawing:empty'
    }
  };
  if (ai.includeReferenceImage !== false && ctx.referenceImageUrl) {
    payload.referenceImageUrl = ctx.referenceImageUrl;
  }
  return payload;
}

/**
 * Downscale a PNG data URL if wider than maxWidth (browser only).
 *
 * @param {string} dataUrl
 * @param {number} [maxWidth]
 * @returns {Promise<string>}
 */
export function downscaleDataUrl(dataUrl, maxWidth = MAX_EXPORT_WIDTH) {
  if (typeof document === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(dataUrl);
        return;
      }
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Resolve host hook if configured.
 *
 * @returns {{ grade: Function }|null}
 */
function getHostHook() {
  if (typeof H5PIntegration === 'undefined' || !H5PIntegration) {
    return null;
  }
  const hook = H5PIntegration.paintAiGrader;
  if (hook && typeof hook.grade === 'function') {
    return hook;
  }
  return null;
}

/**
 * POST payload to author endpoint.
 *
 * @param {string} endpointUrl
 * @param {object} payload
 * @param {number} timeoutMs
 * @returns {Promise<object>}
 */
async function fetchGrade(endpointUrl, payload, timeoutMs) {
  const controller = typeof AbortController !== 'undefined'
    ? new AbortController()
    : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    });
    if (!response.ok) {
      throw new Error(`Grading request failed (${response.status})`);
    }
    return response.json();
  }
  finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

const AiGrader = {
  /**
   * Grade a learner drawing.
   *
   * @param {object} ctx - Grading context from Paint instance.
   * @returns {Promise<{ score: number, feedback: string, confidence: number|null, usedHook: boolean }>}
   */
  async grade(ctx) {
    const ai = ctx.aiGrading || {};
    const maxScore = ctx.maxScore;
    const timeoutMs = Math.max(1000, Number(ai.requestTimeoutMs) || 30000);
    const dataUrl = await downscaleDataUrl(ctx.dataUrl);
    const payload = buildGradingPayload({ ...ctx, dataUrl });

    const hook = getHostHook();
    let body;
    let usedHook = false;

    if (hook) {
      body = await hook.grade(payload);
      usedHook = true;
    }
    else {
      const endpointUrl = (ai.endpointUrl || '').trim();
      if (!endpointUrl) {
        throw new Error('No AI grading endpoint or host hook configured');
      }
      body = await fetchGrade(endpointUrl, payload, timeoutMs);
    }

    const parsed = parseGradingResponse(body, maxScore);
    return { ...parsed, usedHook };
  },

  stripHtml,
  sanitizeFeedback,
  clampScore,
  parseGradingResponse,
  resolveFailureScore,
  buildGradingPayload,
  downscaleDataUrl
};

export default AiGrader;
