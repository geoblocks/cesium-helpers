// For a package that draws over the overlay and ships its stylesheet in its module: the stylesheet put in the page once.

/**
 * A stylesheet in a document, once by its id: a style element first in the head, so that the page's own rules, later in the
 * cascade, win over it at equal specificity.
 * @param {Document} doc @param {string} id @param {string} css
 */
export function installStyle(doc, id, css) {
  if (!doc.getElementById(id)) {
    const style = doc.createElement('style');
    style.id = id;
    style.textContent = css;
    doc.head.prepend(style);
  }
}
