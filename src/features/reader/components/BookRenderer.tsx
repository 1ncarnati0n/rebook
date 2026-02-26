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

export function BookRenderer({
  url,
  initialLocation,
  onProgressChange,
}: BookRendererProps) {
  const renditionRef = useRef<Rendition | null>(null);
  const tocRef = useRef<{ label: string; href: string }[]>([]);

  const { currentLocation, setLocation, setToc, setCurrentChapter, setProgress } =
    useReaderStore();
  const { fontSize, theme, lineHeight, fontFamily, viewMode } = useSettingsStore();

  const isScrolled = viewMode === 'scrolled';

  const applyStyles = useCallback(
    (rendition: Rendition) => {
      const colors = THEME_COLORS[theme];
      const fontStack =
        fontFamily === 'serif'
          ? 'Georgia, "Times New Roman", serif'
          : '-apple-system, "Helvetica Neue", sans-serif';

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
      applyStyles(rendition);
    },
    [applyStyles],
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
          // @ts-expect-error epub.js internal: location.start.index
          const currentIndex = renditionRef.current.location?.start?.index ?? 0;
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
          ? { top: 0, left: 0, bottom: 0, right: 0, inset: 0 }
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
    <div className="h-full w-full" style={{ position: 'relative' }}>
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
