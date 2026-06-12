import PaintCanvas from './canvas/paint-canvas.js';
import Toolbar from './ui/toolbar.js';
import SolutionOverlay from './ui/solution-overlay.js';
import StateService from './services/state.js';
import XapiService from './services/xapi.js';

const DEFAULTS = {
  taskDescription: '',
  media: {
    backgroundImage: null,
    referenceImage: null,
    alternativeText: ''
  },
  canvas: {
    width: 800,
    aspectRatio: '4:3',
    backgroundColor: '#ffffff',
    tools: [
      'pencil', 'brush', 'eraser', 'line', 'rect', 'ellipse',
      'text', 'color', 'size', 'undo', 'redo', 'clear'
    ],
    defaultColor: '#222222',
    defaultBrushSize: 4
  },
  behaviour: {
    enableSubmit: true,
    enableSolution: true,
    enableRetry: true,
    lockAfterSubmit: true
  },
  l10n: {
    submit: 'Submit',
    showSolution: 'Show solution',
    hideSolution: 'Hide solution',
    retry: 'Retry',
    submitted: 'Your drawing has been submitted.',
    noDrawing: 'Please draw something before submitting.',
    solutionTitle: 'Reference',
    yourDrawingTitle: 'Your drawing'
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
  self.contentId = contentId;
  self.extras = extras;
  self.previousState = extras.previousState || null;

  self.state = {
    submitted: false,
    solutionVisible: false,
    locked: false
  };

  self.paintCanvas = null;
  self.toolbar = null;
  self.solutionOverlay = null;
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
    canvasParams: self.params.canvas,
    media: self.params.media,
    a11y: self.params.a11y,
    onChange: () => self._onCanvasChange()
  });
  stage.appendChild(self.paintCanvas.getElement());

  self.toolbar = new Toolbar({
    tools: self.params.canvas.tools,
    a11y: self.params.a11y,
    defaultColor: self.params.canvas.defaultColor,
    defaultBrushSize: self.params.canvas.defaultBrushSize,
    onAction: (action, value) => self._onToolbarAction(action, value)
  });
  stage.insertBefore(self.toolbar.getElement(), self.paintCanvas.getElement());

  self.solutionOverlay = new SolutionOverlay({
    contentId: self.contentId,
    referenceImage: self.params.media.referenceImage,
    l10n: self.params.l10n
  });
  stage.appendChild(self.solutionOverlay.getElement());

  self.setContent(wrapper);
  self._registerButtons();

  self.paintCanvas.ready().then(() => {
    if (self.previousState) {
      StateService.restore(self.paintCanvas, self.previousState);
      if (self.previousState.submitted) {
        self._lockCanvas();
        self.state.submitted = true;
        self._toggleButtonsForSubmitted();
      }
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
    if (self.state.submitted) {
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

  self.state.submitted = true;

  if (self.params.behaviour.lockAfterSubmit) {
    self._lockCanvas();
  }

  self._toggleButtonsForSubmitted();
  self._announce(self.params.l10n.submitted);
  self.triggerXAPIAnswered();
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
    getTitle: () => self.getTitle()
  });

  XapiService.attachImage(xapiEvent, dataUrl).then(() => {
    self.trigger(xapiEvent);
  }).catch((error) => {
    console.warn('H5P.Paint: failed to attach drawing to xAPI', error);
    self.trigger(xapiEvent);
  });
};

Paint.prototype.getAnswerGiven = function () {
  return this.paintCanvas ? this.paintCanvas.hasDrawing() : false;
};

Paint.prototype.getScore = function () {
  return 0;
};

Paint.prototype.getMaxScore = function () {
  return 0;
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
    submitted: self.state.submitted
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
