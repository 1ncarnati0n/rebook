/**
 * epub.js always sets a sandbox attribute on iframes.
 * To maximize extension script injection compatibility, we patch epub.js's
 * IframeView#create and strip sandbox immediately after iframe creation.
 * We additionally keep a MutationObserver fallback for safety.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore internal epub.js module path
import IframeView from 'epubjs/src/managers/views/iframe';

let isPatched = false;

function stripSandbox(iframe: HTMLIFrameElement): void {
  if (iframe.hasAttribute('sandbox')) {
    iframe.removeAttribute('sandbox');
  }
}

export function patchEpubIframeSandbox(): void {
  if (isPatched) return;
  isPatched = true;

  const proto = (IframeView as { prototype?: { create?: (...args: unknown[]) => unknown } }).prototype;
  if (!proto || typeof proto.create !== 'function') return;

  const originalCreate = proto.create;
  proto.create = function patchedCreate(this: unknown, ...args: unknown[]) {
    const iframe = originalCreate.apply(this, args);
    if (iframe instanceof HTMLIFrameElement) {
      stripSandbox(iframe);
    }
    return iframe;
  };
}

export function observeAndStripSandbox(container: HTMLElement): () => void {
  // Strip any iframes already present in the container.
  container
    .querySelectorAll<HTMLIFrameElement>('iframe[sandbox]')
    .forEach(stripSandbox);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle newly-added iframe elements.
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            stripSandbox(node);
          }
          // The iframe may be nested inside a wrapper div.
          if (node instanceof HTMLElement) {
            node
              .querySelectorAll<HTMLIFrameElement>('iframe[sandbox]')
              .forEach(stripSandbox);
          }
        }
      }

      // Handle epub.js re-setting the sandbox attribute.
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'sandbox' &&
        mutation.target instanceof HTMLIFrameElement
      ) {
        stripSandbox(mutation.target);
      }
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['sandbox'],
  });

  return () => observer.disconnect();
}
