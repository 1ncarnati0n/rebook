import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import type { Rendition, NavItem } from 'epubjs';
import { useReaderStore } from '@/stores/readerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  getRenditionSpineProgress,
  navigateRenditionByChapter,
  normalizeArrowKey,
  scrollRenditionByDirection,
} from '@/features/reader/lib/rendition-navigation';
import { findBestMatchingTocPath, getTocItemLabel, observeTocSections } from '@/features/reader/lib/toc';
import { observeAndStripSandbox, patchEpubIframeSandbox } from '@/features/reader/lib/patch-iframe-sandbox';

patchEpubIframeSandbox();

interface BookRendererProps {
  url: string;
  initialLocation: string | null;
  onProgressChange: (location: string, progress: number) => void;
}

const THEME_COLORS = {
  light: { color: '#1a1a2e', background: '#ffffff' },
  sepia: { color: '#5b4636', background: '#f4ecd8' },
} as const;

const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
];

type RenditionDisplayedLocation = {
  href?: string;
};

type RenditionRangeLocation = {
  start?: RenditionDisplayedLocation;
  end?: RenditionDisplayedLocation;
};

type RenditionLocationSource = Rendition & {
  currentLocation?: () =>
    | RenditionDisplayedLocation
    | Promise<RenditionDisplayedLocation>
    | undefined;
  location?: RenditionRangeLocation | undefined;
  manager?: unknown;
};

function getCurrentRenditionHref(
  rendition: Rendition | null | undefined,
): string | null {
  if (!rendition) return null;

  const locationSource = rendition as RenditionLocationSource;
  const rangeHref =
    locationSource.location?.start?.href ?? locationSource.location?.end?.href;
  if (rangeHref) {
    return rangeHref;
  }

  if (!locationSource.manager || !locationSource.currentLocation) {
    return null;
  }

  let currentLocation: RenditionDisplayedLocation | Promise<RenditionDisplayedLocation> | undefined;

  try {
    currentLocation = locationSource.currentLocation();
  } catch {
    // epub.js can throw here before the manager is fully initialized.
    return null;
  }

  if (
    currentLocation &&
    typeof currentLocation === 'object' &&
    'href' in currentLocation
  ) {
    return currentLocation.href ?? null;
  }

  return null;
}

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

export function BookRenderer({
  url,
  initialLocation,
  onProgressChange,
}: BookRendererProps) {
  const renditionRef = useRef<Rendition | null>(null);
  const tocRef = useRef<NavItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observedDocumentsRef = useRef<WeakSet<Document>>(new WeakSet());
  const sectionObserverCleanupRef = useRef<(() => void) | null>(null);

  const {
    currentLocation,
    setLocation,
    setCurrentTocHref,
    setToc,
    setCurrentChapter,
    setProgress,
  } =
    useReaderStore();
  const { fontSize, theme, lineHeight, fontFamily, viewMode } = useSettingsStore();

  const isScrolled = viewMode === 'scrolled';

  const scrollByArrow = useCallback(
    (direction: 'up' | 'down') =>
      scrollRenditionByDirection(renditionRef.current, containerRef.current, direction),
    [],
  );

  const navigateByArrow = useCallback(
    (direction: 'next' | 'prev') =>
      navigateRenditionByChapter(renditionRef.current, direction),
    [],
  );

  const handleArrowKeyScroll = useCallback(
    (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const key = normalizeArrowKey(event.key);
      if (
        key !== 'ArrowUp' &&
        key !== 'ArrowDown' &&
        key !== 'ArrowLeft' &&
        key !== 'ArrowRight'
      ) {
        return;
      }
      if (isInteractiveTarget(event.target)) return;

      let didHandle = false;

      if (key === 'ArrowUp' || key === 'ArrowDown') {
        didHandle = scrollByArrow(key === 'ArrowDown' ? 'down' : 'up');
      } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const next = key === 'ArrowRight';
        didHandle = navigateByArrow(next ? 'next' : 'prev');
      }

      if (didHandle) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [navigateByArrow, scrollByArrow],
  );

  const disableDefaultReaderKeyPress = useCallback(() => {
    // react-reader 기본 좌/우 페이지 넘김을 비활성화하고 커스텀 키맵만 사용한다.
  }, []);

  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      handleArrowKeyScroll(event);
    };

    window.addEventListener('keydown', onWindowKeyDown, {
      passive: false,
      capture: true,
    });
    return () =>
      window.removeEventListener('keydown', onWindowKeyDown, {
        capture: true,
      });
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

      rendition.on('displayerror', (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes('startContainer')) return;

        // Recover from stale/invalid saved CFI by falling back to the beginning.
        setLocation('0');
        void rendition.display(0).catch(() => undefined);
      });

      // Inject Korean web fonts into epub iframe on each chapter load
      rendition.hooks.content.register(
        (contents: { document: Document; window: Window }) => {
          // Safety net: strip sandbox if the MutationObserver missed it.
          const iframe = contents.document.defaultView?.frameElement;
          if (iframe instanceof HTMLIFrameElement && iframe.hasAttribute('sandbox')) {
            iframe.removeAttribute('sandbox');
          }

          if (!observedDocumentsRef.current.has(contents.document)) {
            observedDocumentsRef.current.add(contents.document);
            contents.window.addEventListener(
              'keydown',
              (event) => {
                handleArrowKeyScroll(event as KeyboardEvent);
              },
              { passive: false, capture: true },
            );
            contents.document.addEventListener(
              'keydown',
              (event) => {
                handleArrowKeyScroll(event as KeyboardEvent);
              },
              { passive: false, capture: true },
            );
          }

          FONT_URLS.forEach((href) => {
            if (
              contents.document.head.querySelector(
                `link[data-rebook-font="${href}"]`,
              )
            ) {
              return;
            }
            const link = contents.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.dataset.rebookFont = href;
            contents.document.head.appendChild(link);
          });

          // Hint translation engines/extensions that this chapter is translatable text.
          const html = contents.document.documentElement;
          const body = contents.document.body;
          const lang = html.getAttribute('lang') || body.getAttribute('lang') || 'auto';
          html.setAttribute('translate', 'yes');
          html.setAttribute('lang', lang);
          body.setAttribute('translate', 'yes');
          if (!body.getAttribute('lang')) body.setAttribute('lang', lang);

          // 이전 섹션 옵저버 정리 후 새로 설치
          sectionObserverCleanupRef.current?.();
          const currentHref = getCurrentRenditionHref(rendition);
          sectionObserverCleanupRef.current = observeTocSections(
            contents.document,
            contents.window,
            tocRef.current,
            currentHref,
            (sectionHref) => {
              const store = useReaderStore.getState();
              store.setCurrentTocHref(sectionHref);
            },
          );
        },
      );

      applyStyles(rendition);
    },
    [applyStyles, handleArrowKeyScroll, setLocation],
  );

  // Re-apply styles when settings change
  useEffect(() => {
    if (renditionRef.current) {
      applyStyles(renditionRef.current);
    }
  }, [applyStyles]);

  const syncCurrentTocState = useCallback((rendition: Rendition | null | undefined) => {
    const currentHref = getCurrentRenditionHref(rendition);
    if (!currentHref) return;

    const activePath = findBestMatchingTocPath(tocRef.current, currentHref);
    const activeItem = activePath?.at(-1);

    setCurrentTocHref(activeItem?.href ?? currentHref);

    if (activeItem) {
      setCurrentChapter(getTocItemLabel(activeItem));
    } else if (tocRef.current.length > 0) {
      setCurrentChapter('');
    }
  }, [setCurrentChapter, setCurrentTocHref]);

  const handleLocationChanged = useCallback(
    (loc: string) => {
      setLocation(loc);

      if (!renditionRef.current || !loc) return;

      const progress = getRenditionSpineProgress(renditionRef.current);
      if (progress !== null) {
        setProgress(progress);
        onProgressChange(loc, progress);
      }

      syncCurrentTocState(renditionRef.current);
    },
    [setLocation, setProgress, onProgressChange, syncCurrentTocState],
  );

  const handleTocChanged = useCallback(
    (toc: NavItem[]) => {
      setToc(toc);
      tocRef.current = toc;
      syncCurrentTocState(renditionRef.current);
    },
    [setToc, syncCurrentTocState],
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

  const readerRenderKey = useMemo(
    () => `${viewMode}-${url}`,
    [viewMode, url],
  );

  // Strip sandbox from epub.js iframes so Chrome extensions can inject scripts.
  useEffect(() => {
    if (!containerRef.current) return;
    return observeAndStripSandbox(containerRef.current);
  }, [readerRenderKey]);

  const epubOptions = useMemo(
    () => ({
      manager: 'default',
      flow: isScrolled ? 'scrolled' : 'paginated',
      width: '100%',
    }),
    [isScrolled],
  );

  return (
    <div ref={containerRef} className="h-full w-full" style={{ position: 'relative' }}>
      <ReactReader
        key={readerRenderKey}
        url={url}
        location={readerLocation}
        locationChanged={handleLocationChanged}
        getRendition={handleRendition}
        tocChanged={handleTocChanged}
        showToc={false}
        handleKeyPress={disableDefaultReaderKeyPress}
        epubInitOptions={{
          openAs: 'epub',
        }}
        epubOptions={epubOptions}
        readerStyles={readerStyles}
      />
    </div>
  );
}
