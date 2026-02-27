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
  const tocRef = useRef<{ label: string; href: string }[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observedDocumentsRef = useRef<WeakSet<Document>>(new WeakSet());

  const { currentLocation, setLocation, setToc, setCurrentChapter, setProgress } =
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

      // Inject Korean web fonts into epub iframe on each chapter load
      rendition.hooks.content.register(
        (contents: { document: Document; window: Window }) => {
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

      const progress = getRenditionSpineProgress(renditionRef.current);
      if (progress !== null) {
        setProgress(progress);
        onProgressChange(loc, progress);
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

  const readerRenderKey = useMemo(
    () => `${viewMode}-${url}`,
    [viewMode, url],
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
        epubOptions={{
          manager: 'default',
          flow: isScrolled ? 'scrolled' : 'paginated',
          width: '100%',
          ...(isScrolled ? { allowScriptedContent: true } : {}),
        }}
        readerStyles={readerStyles}
      />
    </div>
  );
}
