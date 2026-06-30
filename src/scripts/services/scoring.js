/**
 * Pure scoring helpers for H5P.Paint (testable without H5P / Fabric).
 */

/**
 * Resolve learner score from mode and state flags.
 *
 * @param {object} ctx
 * @param {string} ctx.mode - manual | completion | ai
 * @param {boolean} ctx.submitted
 * @param {boolean} ctx.hasDrawing
 * @param {number} ctx.maxScore
 * @param {string} ctx.aiGradingStatus - idle | pending | done | error
 * @param {number|null|undefined} ctx.aiScore
 * @returns {number}
 */
export function resolveScore(ctx) {
  const mode = ctx.mode === 'completion' || ctx.mode === 'ai' ? ctx.mode : 'manual';
  if (mode === 'manual') {
    return 0;
  }
  if (!ctx.submitted || !ctx.hasDrawing) {
    return 0;
  }
  if (mode === 'completion') {
    return ctx.maxScore;
  }
  if (mode === 'ai') {
    if (ctx.aiGradingStatus === 'done' || ctx.aiGradingStatus === 'error') {
      return Math.max(0, Number(ctx.aiScore) || 0);
    }
    return 0;
  }
  return 0;
}

/**
 * Whether result.score should be included in an xAPI statement.
 *
 * @param {object} ctx
 * @param {string} ctx.mode - manual | completion | ai
 * @param {boolean} ctx.submitted
 * @param {string} ctx.aiGradingStatus
 * @param {number} ctx.score - resolved score from resolveScore
 * @returns {boolean}
 */
export function shouldIncludeScoreInXapi(ctx) {
  if (!ctx.submitted || ctx.aiGradingStatus === 'pending') {
    return false;
  }
  if (ctx.mode === 'completion') {
    return true;
  }
  if (ctx.mode === 'ai' && ctx.aiGradingStatus === 'done') {
    return true;
  }
  if (ctx.mode === 'ai' && ctx.aiGradingStatus === 'error') {
    return ctx.score > 0;
  }
  return false;
}

/**
 * Normalize AI grading fields when restoring saved state.
 * Pending grading that never finalized leaves the learner stuck without submit.
 *
 * @param {object|null|undefined} state - Serialized previous state.
 * @returns {{ aiGradingStatus: string, interrupted: boolean }}
 */
export function normalizeRestoredAiState(state) {
  if (!state) {
    return { aiGradingStatus: 'idle', interrupted: false };
  }
  if (state.aiGradingStatus === 'pending' && !state.submitted) {
    return { aiGradingStatus: 'idle', interrupted: true };
  }
  return {
    aiGradingStatus: state.aiGradingStatus || 'idle',
    interrupted: false
  };
}
