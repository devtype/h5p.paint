/**
 * Accessible toolbar for the Paint canvas.
 *
 * Builds a real role="toolbar" with arrow-key navigation between tools,
 * keeping a single tool active (via aria-pressed) at any time.
 */

const TOOL_KEYS = [
  'pencil', 'brush', 'eraser', 'line', 'rect', 'ellipse', 'text'
];

const ICONS = {
  pencil: '\u270F\uFE0F',
  brush: '\uD83D\uDD8C\uFE0F',
  eraser: '\uD83E\uDDFD',
  line: '\u2571',
  rect: '\u25A1',
  ellipse: '\u25EF',
  text: 'A',
  color: '\uD83C\uDFA8',
  size: '\u25CF',
  undo: '\u21B6',
  redo: '\u21B7',
  clear: '\uD83D\uDDD1\uFE0F'
};

class Toolbar {
  constructor(opts) {
    this.tools = opts.tools || [];
    this.a11y = opts.a11y || {};
    this.onAction = opts.onAction || (() => {});
    this.color = opts.defaultColor || '#222222';
    this.brushSize = opts.defaultBrushSize || 4;

    this.activeTool = TOOL_KEYS.find((t) => this.tools.includes(t)) || 'pencil';
    this.disabled = false;

    this.buttons = new Map();
    this._build();
    this._setActiveTool(this.activeTool, true);
  }

  _build() {
    this.element = document.createElement('div');
    this.element.classList.add('h5p-paint__toolbar');
    this.element.setAttribute('role', 'toolbar');
    this.element.setAttribute('aria-label', this.a11y.toolbarLabel || 'Drawing tools');

    this.element.addEventListener('keydown', (event) => this._onKeyDown(event));

    for (const tool of this.tools) {
      if (tool === 'color') {
        this._addColorPicker();
      }
      else if (tool === 'size') {
        this._addSizeSlider();
      }
      else {
        this._addToolButton(tool);
      }
    }
  }

  _addToolButton(tool) {
    const isToggle = TOOL_KEYS.includes(tool);
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('h5p-paint__tool');
    button.dataset.tool = tool;
    button.setAttribute('aria-label', this.a11y[`tool_${tool}`] || tool);
    button.setAttribute('title', this.a11y[`tool_${tool}`] || tool);
    button.tabIndex = -1;

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('h5p-paint__tool-icon');
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = ICONS[tool] || '?';
    button.appendChild(iconSpan);

    if (isToggle) {
      button.setAttribute('aria-pressed', 'false');
    }

    button.addEventListener('click', () => {
      if (this.disabled) {
        return;
      }
      if (isToggle) {
        this._setActiveTool(tool);
        this.onAction('tool', tool);
      }
      else {
        this.onAction(tool);
      }
    });

    this.element.appendChild(button);
    this.buttons.set(tool, button);
  }

  _addColorPicker() {
    const wrapper = document.createElement('label');
    wrapper.classList.add('h5p-paint__color');
    wrapper.setAttribute('aria-label', this.a11y.tool_color || 'Color');
    wrapper.title = this.a11y.tool_color || 'Color';

    const input = document.createElement('input');
    input.type = 'color';
    input.value = this.color;
    input.classList.add('h5p-paint__color-input');
    input.tabIndex = -1;
    input.addEventListener('input', () => {
      this.color = input.value;
      this.onAction('color', input.value);
    });

    wrapper.appendChild(input);
    this.element.appendChild(wrapper);
    this.buttons.set('color', input);
  }

  _addSizeSlider() {
    const wrapper = document.createElement('label');
    wrapper.classList.add('h5p-paint__size');
    wrapper.setAttribute('aria-label', this.a11y.tool_size || 'Brush size');
    wrapper.title = this.a11y.tool_size || 'Brush size';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '1';
    input.max = '40';
    input.step = '1';
    input.value = String(this.brushSize);
    input.classList.add('h5p-paint__size-input');
    input.tabIndex = -1;
    input.addEventListener('input', () => {
      this.brushSize = Number(input.value);
      this.onAction('size', this.brushSize);
    });

    wrapper.appendChild(input);
    this.element.appendChild(wrapper);
    this.buttons.set('size', input);
  }

  _setActiveTool(tool, silent = false) {
    this.activeTool = tool;
    for (const [name, el] of this.buttons.entries()) {
      if (!TOOL_KEYS.includes(name)) {
        continue;
      }
      const isActive = name === tool;
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      el.classList.toggle('is-active', isActive);
      el.tabIndex = isActive ? 0 : -1;
    }
    if (!silent) {
      this.focusActive();
    }
    else {
      const active = this.buttons.get(tool);
      if (active) {
        active.tabIndex = 0;
      }
    }
  }

  focusActive() {
    const active = this.buttons.get(this.activeTool);
    if (active && typeof active.focus === 'function') {
      active.focus();
    }
  }

  _focusableButtons() {
    return Array.from(this.element.querySelectorAll('button, input'));
  }

  _onKeyDown(event) {
    const focusables = this._focusableButtons();
    const currentIndex = focusables.indexOf(document.activeElement);
    if (currentIndex === -1) {
      return;
    }

    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % focusables.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = focusables.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusables[nextIndex].focus();
  }

  setDisabled(disabled) {
    this.disabled = !!disabled;
    for (const el of this.buttons.values()) {
      el.disabled = this.disabled;
      if (this.disabled) {
        el.setAttribute('aria-disabled', 'true');
      }
      else {
        el.removeAttribute('aria-disabled');
      }
    }
  }

  getElement() {
    return this.element;
  }
}

export default Toolbar;
