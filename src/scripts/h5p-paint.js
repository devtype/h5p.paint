import PaintCanvas from './canvas/paint-canvas.js';
import Toolbar from './ui/toolbar.js';
import SolutionOverlay from './ui/solution-overlay.js';
import StateService from './services/state.js';
import XapiService from './services/xapi.js';
import AiGrader from './services/ai-grader.js';
import {
  DEFAULT_TOOLS_OBJECT,
  resolveInitialDrawingTool,
  resolveTools
} from './canvas/tool-config.js';
import {
  resolveScore,
  shouldIncludeScoreInXapi,
  normalizeRestoredAiState
} from './services/scoring.js';

const DEFAULTS = {
  taskDescription: '',
  media: {
    referenceImage: null,
    alternativeText: ''
  },
  canvas: {
    width: 800,
    aspectRatio: '4:3',
    background: {
      type: 'color',
      color: '#ffffff',
      image: null
    },
    tools: { ...DEFAULT_TOOLS_OBJECT },
    brushDefaults: {
      defaultColor: '#222222',
      defaultBrushSize: 4
    }
  },
  behaviour: {
    enableSubmit: true,
    enableSolution: true,
    enableRetry: true,
    lockAfterSubmit: true,
    scoringMode: 'manual',
    maxScore: 1,
    aiGrading: {
      endpointUrl: '',
      rubric: '',
      includeReferenceImage: true,
      requestTimeoutMs: 30000,
      maxExportWidth: 1024,
      showFeedbackToLearner: true,
      showConfidenceToLearner: false,
      onFailure: 'zero'
    }
  },
  l10n: {
    submit: 'Submit',
    showSolution: 'Show solution',
    hideSolution: 'Hide solution',
    retry: 'Retry',
    submitted: 'Your drawing has been submitted.',
    noDrawing: 'Please draw something before submitting.',
    solutionTitle: 'Reference',
    yourDrawingTitle: 'Your drawing',
    aiGrading: 'Your drawing is being graded…',
    aiGradingFailed: 'Automatic grading could not be completed.',
    aiFeedbackTitle: 'Feedback',
    aiScoreLabel: 'Score',
    aiConfidenceLabel: 'Confidence',
    aiGradingInterrupted: 'Grading was interrupted. Please submit again.'
  },
  a11y: {
    canvasLabel: 'Drawing area',
    toolbarLabel: 'Drawing tools',
    tool_pencil: 'Pencil',
    tool_brush: 'Brush',
    tool_eraser: 'Eraser',
    tool_line: 'Line',
    tool_rect: 'Rectangle',
    tool_ellipse: 'Ellipse',
    tool_text: 'Add text',
    tool_color: 'Color',
    tool_size: 'Brush size',
    tool_undo: 'Undo',
    tool_redo: 'Redo',
    tool_clear: 'Clear canvas',
    solutionShown: 'Reference solution shown.',
    solutionHidden: 'Reference solution hidden.'
  }
};

/**
 * Deep merge defaults into params (params win).
 */
function mergeDefaults(target, source) {
  if (target === null || target === undefined) {
    return source;
  }
  if (typeof target !== 'object' || Array.isArray(target)) {
    return target;
  }
  const out = Array.isArray(source) ? [...source] : { ...source };
  for (const key of Object.keys(target)) {
    out[key] = mergeDefaults(target[key], source ? source[key] : undefined);
  }
  return out;
}

/**
 * Resolve background config from new semantics or legacy fields.
 *
 * @param {object} params - Merged authoring parameters.
 * @returns {{ type: 'color'|'image', color: string, image?: object|null }}
 */
function resolveBackground(params) {
  const bg = params.canvas && params.canvas.background;
  if (bg && bg.type === 'image' && bg.image && bg.image.path) {
    return {
      type: 'image',
      image: bg.image,
      color: bg.color || '#ffffff'
    };
  }
  if (bg && bg.type === 'color') {
    return {
      type: 'color',
      color: bg.color || '#ffffff'
    };
  }
  if (params.media && params.media.backgroundImage && params.media.backgroundImage.path) {
    return {
      type: 'image',
      image: params.media.backgroundImage,
      color: '#ffffff'
    };
  }
  return {
    type: 'color',
    color: (params.canvas && params.canvas.backgroundColor) || '#ffffff'
  };
}

/**
 * Resolve brush defaults from nested semantics or legacy flat canvas fields.
 *
 * @param {object|null|undefined} canvas - Authoring canvas params.
 * @returns {{ defaultColor: string, defaultBrushSize: number }}
 */
function resolveBrushDefaults(canvas) {
  const nested = canvas && canvas.brushDefaults;
  return {
    defaultColor: nested?.defaultColor ?? canvas?.defaultColor ?? '#222222',
    defaultBrushSize: nested?.defaultBrushSize ?? canvas?.defaultBrushSize ?? 4
  };
}

/**
 * H5P.Paint question type.
 *
 * Uses the standard H5P constructor + prototype pattern required by
 * H5P.newRunnable's ContentType mixin (isRoot, getLibraryFilePath, …).
 * ES6 `class extends H5P.Question` breaks that chain and causes
 * "self.isRoot is not a function" inside H5P.Question.attach().
 *
 * @param {object} params - Authoring parameters from semantics.
 * @param {number} contentId - Identifier for the H5P content.
 * @param {object} [extras] - Extras object including previous state.
 */
function Paint(params, contentId, extras) {
  const self = this;
  extras = extras || {};

  H5P.Question.call(self, 'paint');

  self.params = mergeDefaults(params || {}, DEFAULTS);
  const authorTools = params?.canvas?.tools ?? self.params.canvas.tools;
  self.resolvedTools = resolveTools(authorTools);
  self.initialTool = resolveInitialDrawingTool(self.resolvedTools);
  self.params.canvas.tools = self.resolvedTools;
  self.contentId = contentId;
  self.extras = extras;
  self.previousState = extras.previousState || null;

  self.state = {
    submitted: false,
    solutionVisible: false,
    locked: false,
    aiGradingStatus: 'idle',
    aiScore: null,
    aiFeedback: '',
    aiConfidence: null,
    aiError: null
  };

  self.paintCanvas = null;
  self.toolbar = null;
  self.solutionOverlay = null;
  self.aiStatusEl = null;
  self.aiFeedbackEl = null;
}

Paint.prototype = Object.create(H5P.Question.prototype);
Paint.prototype.constructor = Paint;

/**
 * H5P.Question hook: register DOM elements (intro, content, buttons).
 */
Paint.prototype.registerDomElements = function () {
  const self = this;

  if (self.params.taskDescription && self.params.taskDescription.trim() !== '') {
    self.setIntroduction(self.params.taskDescription);
  }

  const wrapper = document.createElement('div');
  wrapper.classList.add('h5p-paint');

  const stage = document.createElement('div');
  stage.classList.add('h5p-paint__stage');
  wrapper.appendChild(stage);

  self.paintCanvas = new PaintCanvas({
    contentId: self.contentId,
    canvasParams: {
      ...self.params.canvas,
      ...resolveBrushDefaults(self.params.canvas)
    },
    background: resolveBackground(self.params),
    media: self.params.media,
    a11y: self.params.a11y,
    enabledTools: self.resolvedTools,
    initialTool: self.initialTool,
    onChange: () => self._onCanvasChange()
  });
  stage.appendChild(self.paintCanvas.getElement());

  const brushDefaults = resolveBrushDefaults(self.params.canvas);
  self.toolbar = new Toolbar({
    tools: self.resolvedTools,
    initialTool: self.initialTool,
    a11y: self.params.a11y,
    defaultColor: brushDefaults.defaultColor,
    defaultBrushSize: brushDefaults.defaultBrushSize,
    onAction: (action, value) => self._onToolbarAction(action, value)
  });
  stage.insertBefore(self.toolbar.getElement(), self.paintCanvas.getElement());

  self.solutionOverlay = new SolutionOverlay({
    contentId: self.contentId,
    referenceImage: self.params.media.referenceImage,
    l10n: self.params.l10n
  });
  stage.appendChild(self.solutionOverlay.getElement());

  self.aiStatusEl = document.createElement('div');
  self.aiStatusEl.classList.add('h5p-paint__ai-status');
  self.aiStatusEl.setAttribute('role', 'status');
  self.aiStatusEl.hidden = true;
  stage.appendChild(self.aiStatusEl);

  self.aiFeedbackEl = document.createElement('div');
  self.aiFeedbackEl.classList.add('h5p-paint__ai-feedback');
  self.aiFeedbackEl.hidden = true;
  stage.appendChild(self.aiFeedbackEl);

  self.setContent(wrapper);
  self._registerButtons();

  self.paintCanvas.ready().then(() => {
    if (self.previousState) {
      StateService.restore(self.paintCanvas, self.previousState);
      self._restoreFromPreviousState(self.previousState);
    }
    self._updateButtonAvailability();
  });
};

Paint.prototype._registerButtons = function () {
  const self = this;
  const l10n = self.params.l10n;
  const behaviour = self.params.behaviour;

  if (behaviour.enableSubmit) {
    self.addButton(
      'submit-answer',
      l10n.submit,
      () => self._onSubmit(),
      true,
      { 'aria-label': l10n.submit },
      {}
    );
  }

  if (behaviour.enableSolution) {
    self.addButton(
      'show-solution',
      l10n.showSolution,
      () => self._toggleSolution(),
      false,
      { 'aria-label': l10n.showSolution },
      {}
    );
  }

  if (behaviour.enableRetry) {
    self.addButton(
      'try-again',
      l10n.retry,
      () => self._onRetry(),
      false,
      { 'aria-label': l10n.retry },
      {}
    );
  }
};

Paint.prototype._onCanvasChange = function () {
  this._updateButtonAvailability();
};

Paint.prototype._updateButtonAvailability = function () {
  const self = this;
  if (self.params.behaviour.enableSubmit) {
    if (self.state.submitted || self.state.aiGradingStatus === 'pending') {
      self.hideButton('submit-answer');
    }
    else {
      self.showButton('submit-answer');
    }
  }
};

Paint.prototype._onToolbarAction = function (action, value) {
  const self = this;
  if (!self.paintCanvas) {
    return;
  }
  switch (action) {
    case 'tool':
      self.paintCanvas.setTool(value);
      break;
    case 'color':
      self.paintCanvas.setColor(value);
      break;
    case 'size':
      self.paintCanvas.setBrushSize(value);
      break;
    case 'undo':
      self.paintCanvas.undo();
      break;
    case 'redo':
      self.paintCanvas.redo();
      break;
    case 'clear':
      self.paintCanvas.clear();
      break;
    default:
      break;
  }
  self._updateButtonAvailability();
};

Paint.prototype._onSubmit = function () {
  const self = this;
  if (!self.paintCanvas || !self.paintCanvas.hasDrawing()) {
    self._announce(self.params.l10n.noDrawing);
    return;
  }

  if (self._usesAiScoring()) {
    self._submitWithAiGrading();
    return;
  }

  self._finalizeSubmit();
};

Paint.prototype._submitWithAiGrading = function () {
  const self = this;
  const l10n = self.params.l10n;
  const ai = self.params.behaviour.aiGrading || {};

  self.state.aiGradingStatus = 'pending';
  self.state.aiError = null;
  self.hideButton('submit-answer');
  self._showAiStatus(l10n.aiGrading);
  self._announce(l10n.aiGrading);
  if (self.toolbar) {
    self.toolbar.setDisabled(true);
  }

  const dataUrl = self.paintCanvas.exportPNG();
  const summary = self.paintCanvas.getSummary();
  const referenceImage = self.params.media && self.params.media.referenceImage;
  const referenceImageUrl = referenceImage && referenceImage.path
    ? H5P.getPath(referenceImage.path, self.contentId)
    : null;

  AiGrader.grade({
    contentId: self.contentId,
    maxScore: self.getMaxScore(),
    taskDescription: self.params.taskDescription,
    aiGrading: ai,
    dataUrl,
    summary,
    referenceImageUrl
  }).then((result) => {
    self.state.aiScore = result.score;
    self.state.aiFeedback = result.feedback || '';
    self.state.aiConfidence = result.confidence;
    self.state.aiGradingStatus = 'done';
    self._hideAiStatus();
    self._finalizeSubmit();
    if (ai.showFeedbackToLearner !== false) {
      self._showAiFeedback(result.score, result.feedback, result.confidence);
    }
  }).catch((error) => {
    console.warn('H5P.Paint: AI grading failed', error);
    self.state.aiError = error.message || 'Grading failed';
    self.state.aiGradingStatus = 'error';
    const onFailure = ai.onFailure || 'zero';
    self.state.aiScore = AiGrader.resolveFailureScore(
      onFailure,
      self.getMaxScore(),
      self.getAnswerGiven()
    );
    self._hideAiStatus();
    self._showAiStatus(l10n.aiGradingFailed, true);
    self._announce(l10n.aiGradingFailed);
    self._finalizeSubmit();
  });
};

Paint.prototype._finalizeSubmit = function () {
  const self = this;

  self.state.submitted = true;

  if (self.params.behaviour.lockAfterSubmit) {
    self._lockCanvas();
  }

  self._toggleButtonsForSubmitted();
  self._announce(self.params.l10n.submitted);
  self.triggerXAPIAnswered();
};

Paint.prototype._showAiStatus = function (message, isError) {
  const self = this;
  if (!self.aiStatusEl) {
    return;
  }
  self.aiStatusEl.textContent = message;
  self.aiStatusEl.classList.toggle('is-error', !!isError);
  self.aiStatusEl.hidden = false;
};

Paint.prototype._hideAiStatus = function () {
  if (this.aiStatusEl) {
    this.aiStatusEl.hidden = true;
    this.aiStatusEl.classList.remove('is-error');
  }
};

Paint.prototype._showAiFeedback = function (score, feedback, confidence) {
  const self = this;
  if (!self.aiFeedbackEl) {
    return;
  }
  const l10n = self.params.l10n;
  const ai = self.params.behaviour.aiGrading || {};
  self.aiFeedbackEl.innerHTML = '';

  const title = document.createElement('p');
  title.classList.add('h5p-paint__ai-feedback-title');
  title.textContent = l10n.aiFeedbackTitle;
  self.aiFeedbackEl.appendChild(title);

  const scoreLine = document.createElement('p');
  scoreLine.classList.add('h5p-paint__ai-feedback-score');
  scoreLine.textContent = `${l10n.aiScoreLabel}: ${score} / ${self.getMaxScore()}`;
  self.aiFeedbackEl.appendChild(scoreLine);

  if (
    ai.showConfidenceToLearner
    && confidence !== null
    && confidence !== undefined
    && Number.isFinite(Number(confidence))
  ) {
    const confidenceLine = document.createElement('p');
    confidenceLine.classList.add('h5p-paint__ai-feedback-confidence');
    confidenceLine.textContent = `${l10n.aiConfidenceLabel}: ${Math.round(Number(confidence) * 100)}%`;
    self.aiFeedbackEl.appendChild(confidenceLine);
  }

  if (feedback) {
    const body = document.createElement('p');
    body.classList.add('h5p-paint__ai-feedback-text');
    body.textContent = feedback;
    self.aiFeedbackEl.appendChild(body);
  }

  self.aiFeedbackEl.hidden = false;
};

Paint.prototype._hideAiFeedback = function () {
  if (this.aiFeedbackEl) {
    this.aiFeedbackEl.hidden = true;
    this.aiFeedbackEl.innerHTML = '';
  }
};

Paint.prototype._restoreFromPreviousState = function (state) {
  const self = this;
  if (!state) {
    return;
  }
  const normalized = normalizeRestoredAiState(state);
  self.state.aiGradingStatus = normalized.aiGradingStatus;
  if (normalized.interrupted) {
    self._showAiStatus(self.params.l10n.aiGradingInterrupted, true);
    self._announce(self.params.l10n.aiGradingInterrupted);
    self._updateButtonAvailability();
  }
  if (state.aiScore !== undefined && state.aiScore !== null) {
    self.state.aiScore = state.aiScore;
  }
  if (state.aiFeedback) {
    self.state.aiFeedback = state.aiFeedback;
  }
  if (state.aiConfidence !== undefined && state.aiConfidence !== null) {
    self.state.aiConfidence = state.aiConfidence;
  }
  if (state.submitted) {
    self.state.submitted = true;
    self._lockCanvas();
    self._toggleButtonsForSubmitted();
    const ai = self.params.behaviour.aiGrading || {};
    if (
      self.state.aiGradingStatus === 'done'
      && ai.showFeedbackToLearner !== false
    ) {
      self._showAiFeedback(
        self.state.aiScore,
        self.state.aiFeedback,
        self.state.aiConfidence
      );
    }
    if (self.state.aiGradingStatus === 'error') {
      self._showAiStatus(self.params.l10n.aiGradingFailed, true);
    }
  }
};

Paint.prototype._toggleButtonsForSubmitted = function () {
  const self = this;
  self.hideButton('submit-answer');
  if (self.params.behaviour.enableSolution && self.params.media.referenceImage) {
    self.showButton('show-solution');
  }
  if (self.params.behaviour.enableRetry) {
    self.showButton('try-again');
  }
};

Paint.prototype._lockCanvas = function () {
  const self = this;
  self.state.locked = true;
  if (self.paintCanvas) {
    self.paintCanvas.setInteractive(false);
  }
  if (self.toolbar) {
    self.toolbar.setDisabled(true);
  }
};

Paint.prototype._unlockCanvas = function () {
  const self = this;
  self.state.locked = false;
  if (self.paintCanvas) {
    self.paintCanvas.setInteractive(true);
  }
  if (self.toolbar) {
    self.toolbar.setDisabled(false);
  }
};

Paint.prototype._toggleSolution = function () {
  const self = this;
  if (!self.solutionOverlay) {
    return;
  }
  if (self.state.solutionVisible) {
    self.solutionOverlay.hide();
    self.state.solutionVisible = false;
    self._setButtonLabel('show-solution', self.params.l10n.showSolution);
    self._announce(self.params.a11y.solutionHidden);
  }
  else {
    self.solutionOverlay.show();
    self.state.solutionVisible = true;
    self._setButtonLabel('show-solution', self.params.l10n.hideSolution);
    self._announce(self.params.a11y.solutionShown);
  }
};

Paint.prototype._setButtonLabel = function (id, label) {
  const self = this;
  const button = self.$buttonBar
    ? self.$buttonBar.find('.h5p-question-' + id)[0]
    : null;
  if (button) {
    button.textContent = label;
    button.setAttribute('aria-label', label);
  }
};

Paint.prototype._onRetry = function () {
  this.resetTask();
};

Paint.prototype._announce = function (message) {
  if (typeof this.read === 'function') {
    this.read(message);
  }
};

Paint.prototype.triggerXAPIAnswered = function () {
  const self = this;
  if (!self.paintCanvas) {
    return;
  }
  const dataUrl = self.paintCanvas.exportPNG();
  const summary = self.paintCanvas.getSummary();
  const xapiEvent = self.createXAPIEventTemplate('answered');

  XapiService.decorate(xapiEvent, {
    params: self.params,
    contentId: self.contentId,
    dataUrl,
    summary,
    score: self.getScore(),
    maxScore: self.getMaxScore(),
    includeScore: self._shouldIncludeScoreInXapi(),
    aiFeedback: self.state.aiFeedback,
    aiConfidence: self.state.aiConfidence,
    getTitle: () => self.getTitle()
  });

  XapiService.attachImage(xapiEvent, dataUrl).then(() => {
    self.trigger(xapiEvent);
  }).catch((error) => {
    console.warn('H5P.Paint: failed to attach drawing to xAPI', error);
    self.trigger(xapiEvent);
  });
};

Paint.prototype._getScoringMode = function () {
  const mode = this.params.behaviour && this.params.behaviour.scoringMode;
  if (mode === 'completion' || mode === 'ai') {
    return mode;
  }
  return 'manual';
};

Paint.prototype._usesCompletionScoring = function () {
  return this._getScoringMode() === 'completion';
};

Paint.prototype._usesAiScoring = function () {
  return this._getScoringMode() === 'ai';
};

Paint.prototype._shouldIncludeScoreInXapi = function () {
  return shouldIncludeScoreInXapi({
    mode: this._getScoringMode(),
    submitted: this.state.submitted,
    aiGradingStatus: this.state.aiGradingStatus,
    score: this.getScore()
  });
};

Paint.prototype.getAnswerGiven = function () {
  return this.paintCanvas ? this.paintCanvas.hasDrawing() : false;
};

Paint.prototype.getScore = function () {
  return resolveScore({
    mode: this._getScoringMode(),
    submitted: this.state.submitted,
    hasDrawing: this.getAnswerGiven(),
    maxScore: this.getMaxScore(),
    aiGradingStatus: this.state.aiGradingStatus,
    aiScore: this.state.aiScore
  });
};

Paint.prototype.getMaxScore = function () {
  const raw = this.params.behaviour && this.params.behaviour.maxScore;
  const max = Number.isFinite(Number(raw)) ? Math.floor(Number(raw)) : 0;
  return Math.max(0, max);
};

Paint.prototype.showSolutions = function () {
  const self = this;
  if (self.solutionOverlay && !self.state.solutionVisible) {
    self.solutionOverlay.show();
    self.state.solutionVisible = true;
  }
};

Paint.prototype.resetTask = function () {
  const self = this;
  if (self.paintCanvas) {
    self.paintCanvas.reset();
  }
  if (self.solutionOverlay) {
    self.solutionOverlay.hide();
  }
  self.state.submitted = false;
  self.state.solutionVisible = false;
  self.state.aiGradingStatus = 'idle';
  self.state.aiScore = null;
  self.state.aiFeedback = '';
  self.state.aiConfidence = null;
  self.state.aiError = null;
  self._hideAiStatus();
  self._hideAiFeedback();
  self._unlockCanvas();
  self.hideButton('show-solution');
  self.hideButton('try-again');
  if (self.params.behaviour.enableSubmit) {
    self.showButton('submit-answer');
  }
  self._setButtonLabel('show-solution', self.params.l10n.showSolution);
};

Paint.prototype.getCurrentState = function () {
  const self = this;
  if (!self.paintCanvas) {
    return undefined;
  }
  return StateService.serialize(self.paintCanvas, {
    submitted: self.state.submitted,
    aiGradingStatus: self.state.aiGradingStatus,
    aiScore: self.state.aiScore,
    aiFeedback: self.state.aiFeedback,
    aiConfidence: self.state.aiConfidence
  });
};

Paint.prototype.getXAPIData = function () {
  const self = this;
  const xapiEvent = self.createXAPIEventTemplate('answered');
  const dataUrl = self.paintCanvas ? self.paintCanvas.exportPNG() : null;
  const summary = self.paintCanvas ? self.paintCanvas.getSummary() : null;
  XapiService.decorate(xapiEvent, {
    params: self.params,
    contentId: self.contentId,
    dataUrl,
    summary,
    score: self.getScore(),
    maxScore: self.getMaxScore(),
    includeScore: self._shouldIncludeScoreInXapi(),
    aiFeedback: self.state.aiFeedback,
    aiConfidence: self.state.aiConfidence,
    getTitle: () => self.getTitle()
  });
  return { statement: xapiEvent.data.statement };
};

Paint.prototype.getTitle = function () {
  const extras = this.extras || {};
  const meta = extras.metadata || {};
  return meta.title || 'Paint';
};

export default Paint;
