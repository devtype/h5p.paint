import { fabric } from 'fabric';

/**
 * Tools manager for the Fabric.js canvas wrapper.
 *
 * Knows how to switch between drawing modes (pencil, brush, eraser),
 * how to begin/update primitive shapes during drag, and how to add text.
 */
class Tools {
  constructor(canvas, accessors) {
    this.canvas = canvas;
    this.accessors = accessors;
    this._configureBrushes();
  }

  _configureBrushes() {
    this.pencilBrush = new fabric.PencilBrush(this.canvas);
    this.pencilBrush.color = this.accessors.getColor();
    this.pencilBrush.width = Math.max(1, Math.min(this.accessors.getBrushSize(), 6));

    this.brushBrush = new fabric.PencilBrush(this.canvas);
    this.brushBrush.color = this.accessors.getColor();
    this.brushBrush.width = Math.max(4, this.accessors.getBrushSize() * 2);

    this.eraserBrush = new fabric.PencilBrush(this.canvas);
    this.eraserBrush.color = this.canvas.backgroundColor || '#ffffff';
    this.eraserBrush.width = Math.max(8, this.accessors.getBrushSize() * 4);
  }

  activate(tool) {
    this.activeTool = tool;
    this.canvas.isDrawingMode = false;
    this.canvas.selection = false;
    this.canvas.defaultCursor = 'default';

    switch (tool) {
      case 'pencil':
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = this.pencilBrush;
        this.applyColor(this.accessors.getColor());
        this.applyBrushSize(this.accessors.getBrushSize());
        break;
      case 'brush':
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = this.brushBrush;
        this.applyColor(this.accessors.getColor());
        this.applyBrushSize(this.accessors.getBrushSize());
        break;
      case 'eraser':
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = this.eraserBrush;
        this.applyBrushSize(this.accessors.getBrushSize());
        break;
      case 'text':
        this.canvas.defaultCursor = 'text';
        this._enableTextInsertion();
        break;
      case 'line':
      case 'rect':
      case 'ellipse':
        this.canvas.defaultCursor = 'crosshair';
        this._disableTextInsertion();
        break;
      default:
        this._disableTextInsertion();
        break;
    }
  }

  _enableTextInsertion() {
    this._disableTextInsertion();
    this._textHandler = (opt) => {
      const pointer = this.canvas.getPointer(opt.e);
      const text = new fabric.IText('Text', {
        left: pointer.x,
        top: pointer.y,
        fontSize: Math.max(14, this.accessors.getBrushSize() * 4),
        fill: this.accessors.getColor(),
        fontFamily: 'sans-serif'
      });
      this.canvas.add(text);
      this.canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
    };
    this.canvas.on('mouse:down', this._textHandler);
  }

  _disableTextInsertion() {
    if (this._textHandler) {
      this.canvas.off('mouse:down', this._textHandler);
      this._textHandler = null;
    }
  }

  applyColor(color) {
    if (this.canvas.freeDrawingBrush && this.activeTool !== 'eraser') {
      this.canvas.freeDrawingBrush.color = color;
    }
  }

  applyBrushSize(size) {
    if (!this.canvas.freeDrawingBrush) {
      return;
    }
    if (this.activeTool === 'pencil') {
      this.canvas.freeDrawingBrush.width = Math.max(1, Math.min(size, 8));
    }
    else if (this.activeTool === 'brush') {
      this.canvas.freeDrawingBrush.width = Math.max(2, size * 2);
    }
    else if (this.activeTool === 'eraser') {
      this.canvas.freeDrawingBrush.width = Math.max(4, size * 4);
      this.canvas.freeDrawingBrush.color = this.canvas.backgroundColor || '#ffffff';
    }
  }

  beginShape(tool, pointer) {
    const color = this.accessors.getColor();
    const stroke = Math.max(1, this.accessors.getBrushSize());

    switch (tool) {
      case 'line':
        return new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: color,
          strokeWidth: stroke,
          strokeLineCap: 'round',
          selectable: true
        });
      case 'rect':
        return new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 1,
          height: 1,
          fill: 'transparent',
          stroke: color,
          strokeWidth: stroke,
          selectable: true
        });
      case 'ellipse':
        return new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 1,
          ry: 1,
          fill: 'transparent',
          stroke: color,
          strokeWidth: stroke,
          selectable: true,
          originX: 'left',
          originY: 'top'
        });
      default:
        return null;
    }
  }

  updateShape(tool, shape, start, pointer) {
    switch (tool) {
      case 'line':
        shape.set({ x2: pointer.x, y2: pointer.y });
        break;
      case 'rect': {
        const left = Math.min(start.x, pointer.x);
        const top = Math.min(start.y, pointer.y);
        shape.set({
          left,
          top,
          width: Math.abs(pointer.x - start.x),
          height: Math.abs(pointer.y - start.y)
        });
        break;
      }
      case 'ellipse': {
        const left = Math.min(start.x, pointer.x);
        const top = Math.min(start.y, pointer.y);
        shape.set({
          left,
          top,
          rx: Math.abs(pointer.x - start.x) / 2,
          ry: Math.abs(pointer.y - start.y) / 2
        });
        break;
      }
      default:
        break;
    }
  }
}

export default Tools;
