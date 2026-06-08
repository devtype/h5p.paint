/**
 * Side-by-side overlay for the reference / solution image.
 * Hidden by default. The H5P.Paint main class toggles visibility.
 */
class SolutionOverlay {
  constructor(opts) {
    this.contentId = opts.contentId;
    this.referenceImage = opts.referenceImage;
    this.l10n = opts.l10n || {};

    this._build();
  }

  _build() {
    this.element = document.createElement('div');
    this.element.classList.add('h5p-paint__solution');
    this.element.setAttribute('hidden', 'hidden');
    this.element.setAttribute('aria-live', 'polite');

    const title = document.createElement('h3');
    title.classList.add('h5p-paint__solution-title');
    title.textContent = this.l10n.solutionTitle || 'Reference';
    this.element.appendChild(title);

    if (this.referenceImage && this.referenceImage.path) {
      const img = document.createElement('img');
      img.classList.add('h5p-paint__solution-image');
      img.src = H5P.getPath(this.referenceImage.path, this.contentId);
      img.alt = this.l10n.solutionTitle || 'Reference';
      this.element.appendChild(img);
    }
    else {
      const empty = document.createElement('p');
      empty.classList.add('h5p-paint__solution-empty');
      empty.textContent = '—';
      this.element.appendChild(empty);
    }
  }

  show() {
    this.element.removeAttribute('hidden');
  }

  hide() {
    this.element.setAttribute('hidden', 'hidden');
  }

  getElement() {
    return this.element;
  }
}

export default SolutionOverlay;
