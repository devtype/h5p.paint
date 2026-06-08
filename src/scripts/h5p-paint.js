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

class Paint extends H5P.Question {
  /**
   * @param {object} params - Authoring parameters from semantics.
   * @param {number} contentId - Identifier for the H5P content.
   * @param {object} [extras] - Extras object including previous state.
   */
  constructor(params, contentId, extras = {}) {
    super('paint');

    this.params = mergeDefaults(params || {}, DEFAULTS);
    this.contentId = contentId;
    this.extras = extras;

    this.previousState = extras && extras.previousState ? extras.previousState : null;

    this.state = {
      submitted: false,
      solutionVisible: false,
      locked: false
    };

    this.paintCanvas = null;
    this.toolbar = null;
    this.solutionOverlay = null;
  }

  /**
   * H5P.Question hook: register DOM elements (intro, content, buttons).
   */
  registerDomElements() {
    if (this.params.taskDescription && this.params.taskDescription.trim() !== '') {
      this.setIntroduction(this.params.taskDescription);
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-paint');

    const stage = document.createElement('div');
    stage.classList.add('h5p-paint__stage');
    wrapper.appendChild(stage);

    this.paintCanvas = new PaintCanvas({
      contentId: this.contentId,
      canvasParams: this.params.canvas,
      media: this.params.media,
      a11y: this.params.a11y,
      onChange: () => this._onCanvasChange()
    });
    stage.appendChild(this.paintCanvas.getElement());

    this.toolbar = new Toolbar({
      tools: this.params.canvas.tools,
      a11y: this.params.a11y,
      defaultColor: this.params.canvas.defaultColor,
      defaultBrushSize: this.params.canvas.defaultBrushSize,
      onAction: (action, value) => this._onToolbarAction(action, value)
    });
    stage.insertBefore(this.toolbar.getElement(), this.paintCanvas.getElement());

    this.solutionOverlay = new SolutionOverlay({
      contentId: this.contentId,
      referenceImage: this.params.media.referenceImage,
      l10n: this.params.l10n
    });
    stage.appendChild(this.solutionOverlay.getElement());

    this.setContent(wrapper);
    this._registerButtons();

    this.paintCanvas.ready().then(() => {
      if (this.previousState) {
        StateService.restore(this.paintCanvas, this.previousState);
        if (this.previousState.submitted) {
          this._lockCanvas();
          this.state.submitted = true;
          this._toggleButtonsForSubmitted();
        }
      }
      this._updateButtonAvailability();
    });
  }

  _registerButtons() {
    const l10n = this.params.l10n;
    const behaviour = this.params.behaviour;

    if (behaviour.enableSubmit) {
      this.addButton(
        'submit-answer',
        l10n.submit,
        () => this._onSubmit(),
        true,
        { 'aria-label': l10n.submit },
        {}
      );
    }

    if (behaviour.enableSolution) {
      this.addButton(
        'show-solution',
        l10n.showSolution,
        () => this._toggleSolution(),
        false,
        { 'aria-label': l10n.showSolution },
        {}
      );
    }

    if (behaviour.enableRetry) {
      this.addButton(
        'try-again',
        l10n.retry,
        () => this._onRetry(),
        false,
        { 'aria-label': l10n.retry },
        {}
      );
    }
  }

  _onCanvasChange() {
    this._updateButtonAvailability();
  }

  _updateButtonAvailability() {
    const hasDrawing = this.paintCanvas && this.paintCanvas.hasDrawing();
    if (this.params.behaviour.enableSubmit) {
      if (this.state.submitted) {
        this.hideButton('submit-answer');
      }
      else if (hasDrawing) {
        this.showButton('submit-answer');
      }
      else {
        this.showButton('submit-answer');
      }
    }
  }

  _onToolbarAction(action, value) {
    if (!this.paintCanvas) {
      return;
    }
    switch (action) {
      case 'tool':
        this.paintCanvas.setTool(value);
        break;
      case 'color':
        this.paintCanvas.setColor(value);
        break;
      case 'size':
        this.paintCanvas.setBrushSize(value);
        break;
      case 'undo':
        this.paintCanvas.undo();
        break;
      case 'redo':
        this.paintCanvas.redo();
        break;
      case 'clear':
        this.paintCanvas.clear();
        break;
      default:
        break;
    }
    this._updateButtonAvailability();
  }

  _onSubmit() {
    if (!this.paintCanvas || !this.paintCanvas.hasDrawing()) {
      this._announce(this.params.l10n.noDrawing);
      return;
    }

    this.state.submitted = true;

    if (this.params.behaviour.lockAfterSubmit) {
      this._lockCanvas();
    }

    this._toggleButtonsForSubmitted();
    this._announce(this.params.l10n.submitted);

    this.triggerXAPIAnswered();
  }

  _toggleButtonsForSubmitted() {
    this.hideButton('submit-answer');
    if (this.params.behaviour.enableSolution && this.params.media.referenceImage) {
      this.showButton('show-solution');
    }
    if (this.params.behaviour.enableRetry) {
      this.showButton('try-again');
    }
  }

  _lockCanvas() {
    this.state.locked = true;
    if (this.paintCanvas) {
      this.paintCanvas.setInteractive(false);
    }
    if (this.toolbar) {
      this.toolbar.setDisabled(true);
    }
  }

  _unlockCanvas() {
    this.state.locked = false;
    if (this.paintCanvas) {
      this.paintCanvas.setInteractive(true);
    }
    if (this.toolbar) {
      this.toolbar.setDisabled(false);
    }
  }

  _toggleSolution() {
    if (!this.solutionOverlay) {
      return;
    }
    if (this.state.solutionVisible) {
      this.solutionOverlay.hide();
      this.state.solutionVisible = false;
      this._setButtonLabel('show-solution', this.params.l10n.showSolution);
      this._announce(this.params.a11y.solutionHidden);
    }
    else {
      this.solutionOverlay.show();
      this.state.solutionVisible = true;
      this._setButtonLabel('show-solution', this.params.l10n.hideSolution);
      this._announce(this.params.a11y.solutionShown);
    }
  }

  _setButtonLabel(id, label) {
    const button = this.$buttonBar
      ? this.$buttonBar.find('.h5p-question-' + id)[0]
      : null;
    if (button) {
      button.textContent = label;
      button.setAttribute('aria-label', label);
    }
  }

  _onRetry() {
    this.resetTask();
  }

  _announce(message) {
    if (typeof this.read === 'function') {
      this.read(message);
    }
  }

  /**
   * Build and trigger an xAPI 'answered' event with the drawing as attachment.
   */
  triggerXAPIAnswered() {
    if (!this.paintCanvas) {
      return;
    }
    const dataUrl = this.paintCanvas.exportPNG();
    const summary = this.paintCanvas.getSummary();
    const xapiEvent = this.createXAPIEventTemplate('answered');

    XapiService.decorate(xapiEvent, {
      params: this.params,
      contentId: this.contentId,
      dataUrl,
      summary,
      getTitle: () => this.getTitle ? this.getTitle() : 'Paint'
    });

    XapiService.attachImage(xapiEvent, dataUrl).then(() => {
      this.trigger(xapiEvent);
    }).catch((error) => {
      console.warn('H5P.Paint: failed to attach drawing to xAPI', error);
      this.trigger(xapiEvent);
    });
  }

  // ---------------------------------------------------------------------------
  // H5P question type contract
  // ---------------------------------------------------------------------------

  getAnswerGiven() {
    return this.paintCanvas ? this.paintCanvas.hasDrawing() : false;
  }

  getScore() {
    return 0;
  }

  getMaxScore() {
    return 0;
  }

  showSolutions() {
    if (this.solutionOverlay && !this.state.solutionVisible) {
      this.solutionOverlay.show();
      this.state.solutionVisible = true;
    }
  }

  resetTask() {
    if (this.paintCanvas) {
      this.paintCanvas.reset();
    }
    if (this.solutionOverlay) {
      this.solutionOverlay.hide();
    }
    this.state.submitted = false;
    this.state.solutionVisible = false;
    this._unlockCanvas();
    this.hideButton('show-solution');
    this.hideButton('try-again');
    if (this.params.behaviour.enableSubmit) {
      this.showButton('submit-answer');
    }
    this._setButtonLabel('show-solution', this.params.l10n.showSolution);
  }

  getCurrentState() {
    if (!this.paintCanvas) {
      return undefined;
    }
    return StateService.serialize(this.paintCanvas, {
      submitted: this.state.submitted
    });
  }

  getXAPIData() {
    const xapiEvent = this.createXAPIEventTemplate('answered');
    const dataUrl = this.paintCanvas ? this.paintCanvas.exportPNG() : null;
    const summary = this.paintCanvas ? this.paintCanvas.getSummary() : null;
    XapiService.decorate(xapiEvent, {
      params: this.params,
      contentId: this.contentId,
      dataUrl,
      summary,
      getTitle: () => this.getTitle ? this.getTitle() : 'Paint'
    });
    return { statement: xapiEvent.data.statement };
  }

  getTitle() {
    const extras = this.extras || {};
    const meta = extras.metadata || {};
    return meta.title || 'Paint';
  }
}

export default Paint;
