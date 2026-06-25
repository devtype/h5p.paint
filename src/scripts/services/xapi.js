/**
 * xAPI helpers for H5P.Paint.
 *
 * - Verb: answered
 * - interactionType: other (open-ended; not auto-graded)
 * - result.response: short human-readable summary
 * - attachments: the learner's drawing as a PNG (with length + sha2)
 */

const ATTACHMENT_USAGE_TYPE = 'http://h5p.org/x-content-types/H5P.Paint/drawing';
const VERB_ANSWERED = 'http://adlnet.gov/expapi/verbs/answered';

/**
 * Strip the `data:image/...;base64,` prefix from a data URL.
 *
 * @param {string} dataUrl
 * @returns {string}
 */
function stripDataUrlPrefix(dataUrl) {
  const idx = dataUrl.indexOf(',');
  return idx === -1 ? dataUrl : dataUrl.slice(idx + 1);
}

/**
 * Decode base64 string into a Uint8Array (browser-safe).
 *
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToBytes(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compute a hex SHA-256 digest of the given bytes.
 *
 * @param {Uint8Array} bytes
 * @returns {Promise<string>}
 */
async function sha256Hex(bytes) {
  if (!window.crypto || !window.crypto.subtle) {
    return '';
  }
  const buffer = await window.crypto.subtle.digest('SHA-256', bytes);
  const view = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < view.length; i++) {
    hex += view[i].toString(16).padStart(2, '0');
  }
  return hex;
}

const XapiService = {
  /**
   * Decorate an H5P xAPI event template with verb, object definition and result.
   *
   * @param {H5P.XAPIEvent} xapiEvent
   * @param {object} ctx - Context for the statement.
   * @param {object} ctx.params - Authoring params.
   * @param {number} ctx.contentId - H5P content id.
   * @param {string|null} ctx.dataUrl - Drawing data URL.
   * @param {object|null} ctx.summary - Short canvas summary.
   * @param {Function} ctx.getTitle - Function returning the content title.
   */
  decorate(xapiEvent, ctx) {
    const statement = xapiEvent.data.statement;
    const definition = (statement.object.definition = statement.object.definition || {});

    definition.name = definition.name || {};
    definition.name['en-US'] = ctx.getTitle();

    definition.description = definition.description || {};
    const description = (ctx.params.taskDescription || '').replace(/<[^>]*>/g, '').trim();
    definition.description['en-US'] = description || ctx.getTitle();

    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'other';

    statement.verb = {
      id: VERB_ANSWERED,
      display: { 'en-US': 'answered' }
    };

    statement.result = statement.result || {};
    statement.result.completion = true;
    statement.result.response = ctx.summary
      ? `drawing:${ctx.summary.objectCount}objects,${ctx.summary.width}x${ctx.summary.height}`
      : 'drawing:empty';

    if (ctx.includeScore && ctx.maxScore !== undefined && ctx.maxScore > 0) {
      const raw = Math.max(0, Math.min(ctx.maxScore, Number(ctx.score) || 0));
      statement.result.score = {
        raw,
        max: ctx.maxScore,
        scaled: raw / ctx.maxScore
      };
    }
  },

  /**
   * Attach the drawing PNG to the xAPI statement.
   *
   * @param {H5P.XAPIEvent} xapiEvent
   * @param {string|null} dataUrl - PNG data URL.
   * @returns {Promise<void>}
   */
  async attachImage(xapiEvent, dataUrl) {
    if (!dataUrl) {
      return;
    }
    const statement = xapiEvent.data.statement;
    const base64 = stripDataUrlPrefix(dataUrl);
    let bytes;
    try {
      bytes = base64ToBytes(base64);
    }
    catch (e) {
      return;
    }
    let sha2 = '';
    try {
      sha2 = await sha256Hex(bytes);
    }
    catch (e) {
      sha2 = '';
    }

    statement.attachments = statement.attachments || [];
    statement.attachments.push({
      usageType: ATTACHMENT_USAGE_TYPE,
      display: { 'en-US': 'Learner drawing' },
      contentType: 'image/png',
      length: bytes.length,
      sha2,
      fileUrl: dataUrl
    });
  }
};

export default XapiService;
