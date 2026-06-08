/**
 * State serialization helpers for the Paint canvas.
 *
 * - Background / reference images live in the H5P params and are NOT included
 *   in the saved state to keep `getCurrentState()` payloads tiny.
 * - We capture the Fabric scene as JSON and the submitted flag.
 */

const STATE_VERSION = 1;

function stripBackground(json) {
  if (!json) {
    return json;
  }
  const clone = { ...json };
  delete clone.backgroundImage;
  delete clone.background;
  delete clone.backgroundColor;
  return clone;
}

const StateService = {
  /**
   * Build a serializable state snapshot from a PaintCanvas instance.
   *
   * @param {import('../canvas/paint-canvas.js').default} paintCanvas
   * @param {object} extra - Additional flags to include in the state.
   * @returns {object}
   */
  serialize(paintCanvas, extra = {}) {
    const json = paintCanvas.toJSON();
    return {
      v: STATE_VERSION,
      json: stripBackground(json),
      submitted: !!extra.submitted
    };
  },

  /**
   * Restore a previously serialized state into the PaintCanvas.
   *
   * @param {import('../canvas/paint-canvas.js').default} paintCanvas
   * @param {object} state
   * @returns {Promise<void>}
   */
  restore(paintCanvas, state) {
    if (!state || !state.json) {
      return Promise.resolve();
    }
    return paintCanvas.loadFromJSON(state.json);
  }
};

export default StateService;
