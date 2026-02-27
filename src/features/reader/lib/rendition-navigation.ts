import type { Rendition } from 'epubjs';

const SCROLL_STEP_RATIO = 0.8;
const MIN_SCROLL_STEP = 120;

type ReaderContent = {
  document?: Document;
  index?: number;
  sectionIndex?: number;
  window?: Window;
};

type SpineItem = {
  href?: string;
  cfiBase?: string;
};

type SpineRecord = {
  items?: SpineItem[];
  spineItems?: SpineItem[];
};

type RenditionLocation = {
  start?: {
    index?: number;
  };
};

function hasScrollableHeight(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight + 1;
}

function canScrollInDirection(
  element: HTMLElement,
  direction: 'up' | 'down',
): boolean {
  if (!hasScrollableHeight(element)) return false;

  if (direction === 'down') {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  }

  return element.scrollTop > 0;
}

function isScrollableByStyle(element: HTMLElement): boolean {
  const ownerWindow = element.ownerDocument.defaultView;
  if (!ownerWindow) return false;

  const style = ownerWindow.getComputedStyle(element);
  return /(auto|scroll|overlay)/.test(style.overflowY);
}

function getElementScrollStep(element: HTMLElement): number {
  return Math.max(
    Math.round(element.clientHeight * SCROLL_STEP_RATIO),
    MIN_SCROLL_STEP,
  );
}

function scrollElementByStep(
  element: HTMLElement,
  direction: 'up' | 'down',
): boolean {
  if (!canScrollInDirection(element, direction)) return false;

  const delta = direction === 'down' ? 1 : -1;
  element.scrollBy({
    top: getElementScrollStep(element) * delta,
    behavior: 'smooth',
  });
  return true;
}

function findDirectionalScrollableElement(
  root: HTMLElement,
  direction: 'up' | 'down',
): HTMLElement | null {
  const queue: HTMLElement[] = [root];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (isScrollableByStyle(current) && canScrollInDirection(current, direction)) {
      return current;
    }

    const children = Array.from(current.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    queue.push(...children);
  }

  return null;
}

function findScrollableInDocument(
  document: Document,
  direction: 'up' | 'down',
): HTMLElement | null {
  const scrollingElement = document.scrollingElement as HTMLElement | null;
  if (scrollingElement && canScrollInDirection(scrollingElement, direction)) {
    return scrollingElement;
  }

  if (document.body) {
    if (canScrollInDirection(document.body, direction)) {
      return document.body;
    }

    const nestedScrollable = findDirectionalScrollableElement(
      document.body,
      direction,
    );
    if (nestedScrollable) {
      return nestedScrollable;
    }
  }

  if (
    document.documentElement &&
    canScrollInDirection(document.documentElement as HTMLElement, direction)
  ) {
    return document.documentElement as HTMLElement;
  }

  return null;
}

function toContentArray(
  rawContents: ReturnType<Rendition['getContents']>,
): ReaderContent[] {
  if (Array.isArray(rawContents)) {
    return rawContents as ReaderContent[];
  }

  if (rawContents) {
    return [rawContents as ReaderContent];
  }

  return [];
}

function getSpineItems(rendition: Rendition): SpineItem[] {
  const spine = rendition.book?.spine as SpineRecord | undefined;
  return spine?.items || spine?.spineItems || [];
}

function getCurrentSpineIndex(rendition: Rendition): number {
  const location = rendition.location as RenditionLocation | undefined;
  const index = location?.start?.index;
  return typeof index === 'number' ? index : 0;
}

function prioritizeContents(
  contents: ReaderContent[],
  currentIndex: number,
): ReaderContent[] {
  const prioritized: ReaderContent[] = [];
  const pushUnique = (content: ReaderContent | undefined) => {
    if (!content) return;
    if (!prioritized.includes(content)) {
      prioritized.push(content);
    }
  };

  pushUnique(contents.find((content) => content.document?.hasFocus()));

  contents
    .filter(
      (content) =>
        content.sectionIndex === currentIndex || content.index === currentIndex,
    )
    .forEach(pushUnique);

  contents.forEach(pushUnique);

  return prioritized;
}

export function normalizeArrowKey(key: string): string {
  if (key === 'Up') return 'ArrowUp';
  if (key === 'Down') return 'ArrowDown';
  if (key === 'Left') return 'ArrowLeft';
  if (key === 'Right') return 'ArrowRight';
  return key;
}

export function scrollRenditionByDirection(
  rendition: Rendition | null,
  container: HTMLDivElement | null,
  direction: 'up' | 'down',
): boolean {
  if (rendition?.getContents) {
    const contents = toContentArray(rendition.getContents());
    const currentIndex = getCurrentSpineIndex(rendition);
    const prioritizedContents = prioritizeContents(contents, currentIndex);

    for (const content of prioritizedContents) {
      const contentDocument = content.document || content.window?.document;
      if (!contentDocument) continue;

      const iframeScrollable = findScrollableInDocument(contentDocument, direction);
      if (iframeScrollable && scrollElementByStep(iframeScrollable, direction)) {
        return true;
      }
    }
  }

  if (container) {
    const scrollable = findDirectionalScrollableElement(container, direction);
    if (scrollable && scrollElementByStep(scrollable, direction)) {
      return true;
    }
  }

  return false;
}

export function navigateRenditionByChapter(
  rendition: Rendition | null,
  direction: 'next' | 'prev',
): boolean {
  if (!rendition) return false;

  const items = getSpineItems(rendition);
  if (items.length === 0) return false;

  const currentIndex = getCurrentSpineIndex(rendition);
  const delta = direction === 'next' ? 1 : -1;
  const targetIndex = Math.min(Math.max(currentIndex + delta, 0), items.length - 1);

  if (targetIndex === currentIndex) {
    return false;
  }

  const targetItem = items[targetIndex];
  const target = targetItem?.href || targetItem?.cfiBase;

  if (target) {
    rendition.display(target);
  } else if (direction === 'next') {
    rendition.next();
  } else {
    rendition.prev();
  }

  return true;
}

export function getRenditionSpineProgress(rendition: Rendition | null): number | null {
  if (!rendition) return null;

  const items = getSpineItems(rendition);
  if (items.length === 0) return null;

  const currentIndex = getCurrentSpineIndex(rendition);
  const boundedIndex = Math.min(Math.max(currentIndex, 0), items.length - 1);
  return Math.min(Math.round(((boundedIndex + 1) / items.length) * 100), 100);
}
