import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import type { Rendition, NavItem } from 'epubjs';
import { useReaderStore } from '@/stores/readerStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface BookRendererProps {
  url: string;
  initialLocation: string | null;
  onProgressChange: (location: string, progress: number) => void;
}

const THEME_COLORS = {
  light: { color: '#1a1a2e', background: '#ffffff' },
  sepia: { color: '#5b4636', background: '#f4ecd8' },
  dark: { color: '#d4d4d8', background: '#1c1c1e' },
} as const;

const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
];

const SCROLL_STEP_RATIO = 0.8;
const MIN_SCROLL_STEP = 120;

function getEventElement(target: EventTarget | null): Element | null {
  if (!target || typeof target !== 'object' || !('nodeType' in target)) {
    return null;
  }

  const node = target as Node;
  if (node.nodeType === Node.ELEMENT_NODE) {
    return node as Element;
  }

  return node.parentElement;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const element = getEventElement(target);
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  if ((element as HTMLElement).isContentEditable) {
    return true;
  }

  return Boolean(element.closest('input, textarea, select, [contenteditable="true"], [role="slider"]'));
}

function findScrollableElement(root: HTMLElement): HTMLElement | null {
  const queue: HTMLElement[] = [root];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const style = window.getComputedStyle(current);
    const canScrollY = /(auto|scroll)/.test(style.overflowY);
    const hasScrollableContent = current.scrollHeight > current.clientHeight + 1;

    if (canScrollY && hasScrollableContent) {
      return current;
    }

    const children = Array.from(current.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    queue.push(...children);
  }

  return null;
}

export function BookRenderer({
  url,
  initialLocation,
  onProgressChange,
}: BookRendererProps) {
  const renditionRef = useRef<Rendition | null>(null);
  const tocRef = useRef<{ label: string; href: string }[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrolledRef = useRef(false);

  const { currentLocation, setLocation, setToc, setCurrentChapter, setProgress } =
    useReaderStore();
  const { fontSize, theme, lineHeight, fontFamily, viewMode } = useSettingsStore();

  const isScrolled = viewMode === 'scrolled';

  useEffect(() => {
    isScrolledRef.current = isScrolled;
  }, [isScrolled]);

  const scrollByArrow = useCallback((direction: 'up' | 'down') => {
    const delta = direction === 'down' ? 1 : -1;
    const rendition = renditionRef.current;

    if (rendition?.getContents) {
      const rawContents = rendition.getContents();
      const contents = Array.isArray(rawContents)
        ? rawContents
        : rawContents
          ? [rawContents]
          : [];
      const currentIndex = rendition.location?.start?.index;
      const activeContent =
        contents.find((content) => content?.sectionIndex === currentIndex) ||
        contents[0];

      if (activeContent?.window) {
        const amount = Math.max(
          Math.round(activeContent.window.innerHeight * SCROLL_STEP_RATIO),
          MIN_SCROLL_STEP,
        );
        activeContent.window.scrollBy({
          top: amount * delta,
          behavior: 'smooth',
        });
        return true;
      }
    }

    if (containerRef.current) {
      const scrollable = findScrollableElement(containerRef.current);
      if (scrollable) {
        const amount = Math.max(
          Math.round(scrollable.clientHeight * SCROLL_STEP_RATIO),
          MIN_SCROLL_STEP,
        );
        scrollable.scrollBy({
          top: amount * delta,
          behavior: 'smooth',
        });
        return true;
      }
    }

    return false;
  }, []);

  const handleArrowKeyScroll = useCallback(
    (event: KeyboardEvent) => {
      if (!isScrolledRef.current) return;
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (isInteractiveTarget(event.target)) return;

      const didScroll = scrollByArrow(event.key === 'ArrowDown' ? 'down' : 'up');
      if (didScroll) {
        event.preventDefault();
      }
    },
    [scrollByArrow],
  );

  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      handleArrowKeyScroll(event);
    };

    window.addEventListener('keydown', onWindowKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [handleArrowKeyScroll]);

  const applyStyles = useCallback(
    (rendition: Rendition) => {
      const colors = THEME_COLORS[theme];
      const fontStack =
        fontFamily === 'serif'
          ? '"Noto Serif KR", Georgia, "Times New Roman", serif'
          : 'Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", -apple-system, "Helvetica Neue", sans-serif';

      rendition.themes.register('custom', {
        body: {
          'font-size': `${fontSize}px !important`,
          'line-height': `${lineHeight} !important`,
          'font-family': `${fontStack} !important`,
        },
        'p, div, span, li, td, th, h1, h2, h3, h4, h5, h6': {
          'font-size': 'inherit !important',
          'line-height': 'inherit !important',
          'font-family': 'inherit !important',
        },
      });
      rendition.themes.select('custom');
      rendition.themes.override('color', colors.color);
      rendition.themes.override('background', colors.background);
    },
    [fontSize, theme, lineHeight, fontFamily],
  );

  const handleRendition = useCallback(
    (rendition: Rendition) => {
      renditionRef.current = rendition;

      // Inject Korean web fonts into epub iframe on each chapter load
      rendition.hooks.content.register(
        (contents: { document: Document; window: Window }) => {
          FONT_URLS.forEach((href) => {
            const link = contents.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            contents.document.head.appendChild(link);
          });

          contents.document.addEventListener(
            'keydown',
            (event) => {
              handleArrowKeyScroll(event);
            },
            { passive: false },
          );
        },
      );

      applyStyles(rendition);
    },
    [applyStyles, handleArrowKeyScroll],
  );

  // Re-apply styles when settings change
  useEffect(() => {
    if (renditionRef.current) {
      applyStyles(renditionRef.current);
    }
  }, [applyStyles]);

  const handleLocationChanged = useCallback(
    (loc: string) => {
      setLocation(loc);

      if (!renditionRef.current || !loc) return;

      try {
        const book = renditionRef.current.book;
        if (book?.spine) {
          // @ts-expect-error epub.js internal: spine.items not in public types
          const items = book.spine.items || book.spine.spineItems || [];
          const total = items.length;
          const currentIndex = (renditionRef.current.location?.start as { index?: number })?.index ?? 0;
          const progress = total > 0 ? Math.min(Math.round(((currentIndex + 1) / total) * 100), 100) : 0;
          setProgress(progress);
          onProgressChange(loc, progress);
        }
      } catch {
        // Progress calculation can fail for some EPUBs
      }

      // Update current chapter from TOC
      if (tocRef.current.length > 0) {
        const chapter = tocRef.current.find(
          (item) => loc.includes(item.href) || item.href.includes(loc),
        );
        if (chapter) {
          setCurrentChapter(chapter.label);
        }
      }
    },
    [setLocation, setProgress, setCurrentChapter, onProgressChange],
  );

  const handleTocChanged = useCallback(
    (toc: NavItem[]) => {
      setToc(toc);
      tocRef.current = toc.map((item) => ({
        label: item.label,
        href: item.href,
      }));
    },
    [setToc],
  );

  const readerLocation = currentLocation || initialLocation || 0;

  const readerStyles = useMemo(
    () => ({
      ...ReactReaderStyle,
      container: {
        ...ReactReaderStyle.container,
      },
      readerArea: {
        ...ReactReaderStyle.readerArea,
        backgroundColor: THEME_COLORS[theme].background,
        transition: 'background-color 0.3s ease',
      },
      reader: {
        ...ReactReaderStyle.reader,
        ...(isScrolled
          ? {
              top: 20,
              bottom: 20,
              left: '50%',
              right: 'auto',
              transform: 'translateX(-50%)',
              maxWidth: 720,
              width: 'calc(100% - 48px)',
            }
          : {}),
      },
      arrow: {
        ...ReactReaderStyle.arrow,
        ...(isScrolled ? { display: 'none' as const } : {}),
      },
    }),
    [theme, isScrolled],
  );

  return (
    <div ref={containerRef} className="h-full w-full" style={{ position: 'relative' }}>
      <ReactReader
        url={url}
        location={readerLocation}
        locationChanged={handleLocationChanged}
        getRendition={handleRendition}
        tocChanged={handleTocChanged}
        showToc={false}
        epubInitOptions={{
          openAs: 'epub',
        }}
        epubOptions={{
          flow: isScrolled ? 'scrolled' : 'paginated',
          width: '100%',
          ...(isScrolled ? { allowScriptedContent: true } : {}),
        }}
        readerStyles={readerStyles}
      />
    </div>
  );
}
