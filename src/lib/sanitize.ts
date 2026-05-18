const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'span', 'div', 'code', 'pre']);
const ALLOWED_ATTRS = new Set(['class', 'href', 'target', 'rel']);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined' || !window.document) {
    return escapeHtml(html);
  }

  const template = window.document.createElement('template');
  template.innerHTML = html;

  const sanitizeNode = (node: Node): void => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        element.replaceWith(window.document.createTextNode(element.textContent || ''));
        return;
      }

      for (const attr of Array.from(element.attributes)) {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value.trim();
        const isSafeHref = attrName !== 'href' || /^(https?:|mailto:|\/)/i.test(attrValue);

        if (!ALLOWED_ATTRS.has(attrName) || attrName.startsWith('on') || !isSafeHref) {
          element.removeAttribute(attr.name);
        }
      }

      if (tagName === 'a') {
        element.setAttribute('rel', 'noopener noreferrer');
        element.setAttribute('target', '_blank');
      }
    }

    for (const child of Array.from(node.childNodes)) {
      sanitizeNode(child);
    }
  };

  sanitizeNode(template.content);
  return template.innerHTML;
}
