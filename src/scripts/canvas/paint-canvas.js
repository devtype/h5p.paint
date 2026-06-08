import { fabric } from 'fabric';
import Tools from './tools.js';

const RATIO_MAP = {
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '1:1': 1,
  '3:4': 3 / 4
};

const HISTORY_LIMIT = 50;

/**
 * Wraps a Fabric.js canvas to provide tools, undo/redo, export, and resize.
 */
class PaintCanvas {
  /**
   * @param {object} opts - Construction options.
   * @param {number} opts.contentId - H5P content id (for media URL resolution).
   * @param {object} opts.canvasParams - Authoring canvas group params.
   * @param {object} opts.media - Authoring media group params.
   * @param {object} opts.a11y - Accessibility translations.
   * @param {Function} [opts.onChange] - Callback fired after canvas mutations.
   */
  constructor(opts) {
    this.contentId = opts.contentId;
    this.canvasParams = opts.canvasParams;
    this.media = opts.media || {};
    this.a11y = opts.a11y || {};
    this.onChange = opts.onChange || (() => {});

    this.history = [];
    this.future = [];
    this.suspended = false;

    this.color = this.canvasParams.defaultColor || '#222222';
    this.brushSize = this.canvasParams.defaultBrushSize || 4;
    this.currentTool = 'pencil';
    this.shapeStart = null;
    this.shapeBeingDrawn = null;
    this.interactive = true;

    this._buildDom();
    this._initFabric();
    this._initEvents();
    this._readyPromise = this._loadBackgroundImage();
  }

  _buildDom() {
    this.element = document.createElement('div');
    this.element.classList.add('h5p-paint__canvas-wrapper');

    this.canvasHost = document.createElement('div');
    this.canvasHost.classList.add('h5p-paint__canvas-host');

    this.canvasEl = document.createElement('canvas');
    this.canvasEl.setAttribute('aria-label', this.media.alternativeText || this.a11y.canvasLabel || 'Drawing area');
    this.canvasEl.setAttribute('role', 'img');
    this.canvasEl.setAttribute('tabindex', '0');

    this.canvasHost.appendChild(this.canvasEl);
    this.element.appendChild(this.canvasHost);
  }

  _initFabric() {
    const baseWidth = Number(this.canvasParams.width) || 800;
    const ratio = RATIO_MAP[this.canvasParams.aspectRatio] || RATIO_MAP['4:3'];
    const baseHeight = Math.round(baseWidth / ratio);

    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;

    this.canvas = new fabric.Canvas(this.canvasEl, {
      width: baseWidth,
      height: baseHeight,
      backgroundColor: this.canvasParams.backgroundColor || '#ffffff',
      preserveObjectStacking: true,
      selection: false,
      enableRetinaScaling: true
    });

    this.tools = new Tools(this.canvas, {
      getColor: () => this.color,
      getBrushSize: () => this.brushSize
    });
    this.tools.activate(this.currentTool);
  }

  _initEvents() {
    const onModified = () => {
      if (!this.suspended) {
        this._snapshot();
        this.onChange();
      }
    };

    this.canvas.on('object:added', () => {
      if (!this.suspended) {
        this._snapshot();
        this.onChange();
      }
    });
    this.canvas.on('object:modified', onModified);
    this.canvas.on('object:removed', onModified);

    this.canvas.on('mouse:down', (e) => this._onMouseDown(e));
    this.canvas.on('mouse:move', (e) => this._onMouseMove(e));
    this.canvas.on('mouse:up', () => this._onMouseUp());

    if (typeof window !== 'undefined' && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this._fit());
      this.resizeObserver.observe(this.canvasHost);
    }
  }

  _onMouseDown(opt) {
    if (!this.interactive) {
      return;
    }
    if (!['line', 'rect', 'ellipse'].includes(this.currentTool)) {
      return;
    }
    const pointer = this.canvas.getPointer(opt.e);
    this.shapeStart = pointer;
    this.suspended = true;

    const shape = this.tools.beginShape(this.currentTool, pointer);
    if (shape) {
      this.shapeBeingDrawn = shape;
      this.canvas.add(shape);
    }
  }

  _onMouseMove(opt) {
    if (!this.interactive || !this.shapeBeingDrawn || !this.shapeStart) {
      return;
    }
    const pointer = this.canvas.getPointer(opt.e);
    this.tools.updateShape(this.currentTool, this.shapeBeingDrawn, this.shapeStart, pointer);
    this.canvas.requestRenderAll();
  }

  _onMouseUp() {
    if (!this.shapeBeingDrawn) {
      return;
    }
    this.shapeBeingDrawn.setCoords();
    this.shapeBeingDrawn = null;
    this.shapeStart = null;
    this.suspended = false;
    this._snapshot();
    this.onChange();
  }

  _snapshot() {
    const json = JSON.stringify(this.canvas.toJSON(['selectable', 'evented']));
    this.history.push(json);
    if (this.history.length > HISTORY_LIMIT) {
      this.history.shift();
    }
    this.future = [];
  }

  _fit() {
    if (!this.canvasHost) {
      return;
    }
    const containerWidth = this.canvasHost.clientWidth;
    if (!containerWidth) {
      return;
    }
    const scale = containerWidth / this.baseWidth;
    if (scale <= 0) {
      return;
    }
    this.canvas.setZoom(scale);
    this.canvas.setWidth(this.baseWidth * scale);
    this.canvas.setHeight(this.baseHeight * scale);
    this.canvas.requestRenderAll();
  }

  _loadBackgroundImage() {
    return new Promise((resolve) => {
      const bg = this.media.backgroundImage;
      if (!bg || !bg.path) {
        this._fit();
        resolve();
        return;
      }
      const url = H5P.getPath(bg.path, this.contentId);
      fabric.Image.fromURL(url, (img) => {
        if (!img) {
          this._fit();
          resolve();
          return;
        }

        if (this.canvasParams.aspectRatio === 'background' && img.width && img.height) {
          this.baseHeight = Math.round((this.baseWidth * img.height) / img.width);
          this.canvas.setHeight(this.baseHeight);
        }

        const scaleX = this.baseWidth / img.width;
        const scaleY = this.baseHeight / img.height;
        const scale = Math.min(scaleX, scaleY);
        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false
        });

        this.canvas.setBackgroundImage(img, () => {
          this.canvas.requestRenderAll();
          this._fit();
          this._snapshot();
          resolve();
        });
      }, { crossOrigin: 'anonymous' });
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  ready() {
    return this._readyPromise || Promise.resolve();
  }

  getElement() {
    return this.element;
  }

  setTool(tool) {
    this.currentTool = tool;
    this.tools.activate(tool);
  }

  setColor(color) {
    this.color = color;
    this.tools.applyColor(color);
  }

  setBrushSize(size) {
    this.brushSize = Number(size) || this.brushSize;
    this.tools.applyBrushSize(this.brushSize);
  }

  setInteractive(interactive) {
    this.interactive = !!interactive;
    this.canvas.isDrawingMode = this.interactive && (this.currentTool === 'pencil' || this.currentTool === 'brush' || this.currentTool === 'eraser');
    this.canvas.selection = false;
    this.canvas.forEachObject((o) => {
      o.selectable = this.interactive;
      o.evented = this.interactive;
    });
    this.canvas.requestRenderAll();
  }

  undo() {
    if (this.history.length <= 1) {
      return;
    }
    const current = this.history.pop();
    this.future.push(current);
    const prev = this.history[this.history.length - 1];
    this._loadJson(prev);
  }

  redo() {
    if (!this.future.length) {
      return;
    }
    const next = this.future.pop();
    this.history.push(next);
    this._loadJson(next);
  }

  clear() {
    const objects = this.canvas.getObjects().slice();
    this.suspended = true;
    objects.forEach((o) => this.canvas.remove(o));
    this.suspended = false;
    this._snapshot();
    this.onChange();
  }

  reset() {
    this.history = [];
    this.future = [];
    this.canvas.clear();
    this.canvas.backgroundColor = this.canvasParams.backgroundColor || '#ffffff';
    this._readyPromise = this._loadBackgroundImage();
    this.canvas.requestRenderAll();
    this.onChange();
  }

  hasDrawing() {
    return this.canvas.getObjects().length > 0;
  }

  exportPNG() {
    return this.canvas.toDataURL({ format: 'png', multiplier: 1 });
  }

  toJSON() {
    return this.canvas.toJSON(['selectable', 'evented']);
  }

  loadFromJSON(json) {
    return new Promise((resolve) => {
      this.suspended = true;
      this.canvas.loadFromJSON(json, () => {
        this.canvas.requestRenderAll();
        this.suspended = false;
        this._snapshot();
        resolve();
      });
    });
  }

  _loadJson(json) {
    this.suspended = true;
    this.canvas.loadFromJSON(json, () => {
      this.canvas.requestRenderAll();
      this.suspended = false;
      this.onChange();
    });
  }

  getSummary() {
    const objects = this.canvas.getObjects();
    return {
      objectCount: objects.length,
      width: this.baseWidth,
      height: this.baseHeight
    };
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.canvas) {
      this.canvas.dispose();
    }
  }
}

export default PaintCanvas;
