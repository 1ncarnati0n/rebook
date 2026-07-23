import type { NavItem } from 'epubjs';

type NormalizedHrefParts = {
  full: string;
  path: string;
  hash: string;
  basename: string;
};

function normalizePathSegments(path: string): string {
  const segments: string[] = [];

  path.split('/').forEach((segment) => {
    const trimmed = segment.trim();
    if (!trimmed || trimmed === '.') return;
    if (trimmed === '..') {
      segments.pop();
      return;
    }
    segments.push(trimmed);
  });

  return segments.join('/');
}

function getNormalizedHrefParts(
  href: string | null | undefined,
): NormalizedHrefParts | null {
  if (!href) return null;

  let normalized = href.trim();
  if (!normalized) return null;

  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep the original href when percent-decoding fails.
  }

  normalized = normalized.replace(/\\/g, '/');
  normalized = normalized.replace(/^[a-z]+:\/\/[^/]+/i, '');

  const [withoutQuery = ''] = normalized.split('?');
  const [pathPart = '', hashPart = ''] = withoutQuery.split('#');
  const path = normalizePathSegments(pathPart.replace(/^\/+/, '')).toLowerCase();
  const hash = hashPart.trim().toLowerCase();
  const full = hash ? `${path}#${hash}` : path;
  const basename = path.split('/').filter(Boolean).at(-1) ?? path;

  if (!full && !path) return null;

  return {
    full,
    path,
    hash,
    basename,
  };
}

function getMatchScore(
  itemHref: NormalizedHrefParts | null,
  currentHref: NormalizedHrefParts | null,
): number {
  if (!itemHref || !currentHref) return -1;

  if (itemHref.full === currentHref.full) {
    return 500;
  }

  if (itemHref.path && itemHref.path === currentHref.path) {
    if (!itemHref.hash && !currentHref.hash) return 440;
    if (!itemHref.hash) return 430;
    return 360;
  }

  if (!itemHref.path || !currentHref.path) return -1;

  if (
    currentHref.path.endsWith(itemHref.path) ||
    itemHref.path.endsWith(currentHref.path)
  ) {
    return itemHref.hash ? 280 : 300;
  }

  if (itemHref.basename && itemHref.basename === currentHref.basename) {
    return itemHref.hash ? 180 : 200;
  }

  return -1;
}

export function normalizeTocHref(href: string | null | undefined): string {
  return getNormalizedHrefParts(href)?.full ?? '';
}

export function getTocItemLabel(item: NavItem): string {
  return item.label.trim() || 'Untitled';
}

export function flattenTocItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [
    item,
    ...flattenTocItems(item.subitems ?? []),
  ]);
}

/**
 * iframe 내부에서 TOC 항목에 해당하는 앵커 요소들을 찾고,
 * IntersectionObserver로 현재 보이는 섹션을 추적합니다.
 */
export function observeTocSections(
  iframeDoc: Document,
  iframeWin: Window,
  tocItems: NavItem[],
  currentChapterHref: string | null,
  onActiveSectionChange: (href: string) => void,
): () => void {
  const currentParts = getNormalizedHrefParts(currentChapterHref);
  const currentPath = currentParts?.path ?? '';

  // 현재 챕터에 속하는 TOC 항목들만 필터링
  const flat = flattenTocItems(tocItems);
  const chapterItems = flat.filter((item) => {
    const parts = getNormalizedHrefParts(item.href);
    if (!parts) return false;
    // 같은 파일(path)에 속하는 항목들
    if (parts.path === currentPath) return true;
    if (currentPath && (currentPath.endsWith(parts.path) || parts.path.endsWith(currentPath))) return true;
    if (parts.basename && currentParts?.basename && parts.basename === currentParts.basename) return true;
    return false;
  });

  if (chapterItems.length === 0) return () => {};

  // TOC href → iframe 내 실제 요소 매핑
  type AnchorEntry = { element: Element; href: string };
  const anchorEntries: AnchorEntry[] = [];

  for (const item of chapterItems) {
    const parts = getNormalizedHrefParts(item.href);
    if (!parts) continue;

    let element: Element | null = null;

    // 1) hash가 있으면 id로 직접 찾기
    if (parts.hash) {
      element = iframeDoc.getElementById(parts.hash);
      // name 속성으로도 시도
      if (!element) {
        element = iframeDoc.querySelector(`[name="${CSS.escape(parts.hash)}"]`);
      }
    }

    // 2) hash가 없으면 heading 텍스트 매칭 시도
    if (!element) {
      const label = item.label.trim().toLowerCase();
      if (label) {
        const headings = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (const h of headings) {
          const hText = (h.textContent ?? '').trim().toLowerCase();
          if (hText === label || hText.includes(label) || label.includes(hText)) {
            // 이미 매핑된 heading이 아닌지 확인
            if (!anchorEntries.some((e) => e.element === h)) {
              element = h;
              break;
            }
          }
        }
      }
    }

    if (element) {
      anchorEntries.push({ element, href: item.href });
    }
  }

  if (anchorEntries.length === 0) return () => {};

  // 현재 뷰포트 상단에 가장 가까운 섹션 추적
  let rafId = 0;
  const visibleSet = new Set<Element>();

  const updateActiveSection = () => {
    rafId = 0;

    // 문서 순서대로 보이는 요소 중 가장 먼저 나오는 것 선택
    // 보이는 요소가 없으면 뷰포트 위에 있는 요소 중 가장 마지막 것 선택
    let bestEntry: AnchorEntry | null = null;

    if (visibleSet.size > 0) {
      // 보이는 요소 중 문서 순서상 가장 위에 있는 것
      for (const entry of anchorEntries) {
        if (visibleSet.has(entry.element)) {
          bestEntry = entry;
          break;
        }
      }
    } else {
      // 아무것도 안 보이면 뷰포트 위에 있는 요소 중 마지막 것 (이미 지나간 섹션)
      for (const entry of anchorEntries) {
        const rect = entry.element.getBoundingClientRect();
        if (rect.top < 0) {
          bestEntry = entry;
        } else {
          break;
        }
      }
    }

    if (bestEntry) {
      onActiveSectionChange(bestEntry.href);
    }
  };

  const scheduleUpdate = () => {
    if (rafId) return;
    rafId = iframeWin.requestAnimationFrame(updateActiveSection);
  };

  const IntersectionObserverCtor = (
    iframeWin as Window & typeof globalThis
  ).IntersectionObserver;

  if (!IntersectionObserverCtor) return () => {};

  const observer = new IntersectionObserverCtor(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleSet.add(entry.target);
        } else {
          visibleSet.delete(entry.target);
        }
      }
      scheduleUpdate();
    },
    {
      root: null, // iframe 뷰포트
      rootMargin: '-10% 0px -60% 0px', // 상단 근처에 있는 요소를 우선
      threshold: 0,
    },
  );

  for (const entry of anchorEntries) {
    observer.observe(entry.element);
  }

  // 초기 상태 업데이트 (이미 보이는 섹션 감지)
  iframeWin.requestAnimationFrame(updateActiveSection);

  return () => {
    observer.disconnect();
    if (rafId) iframeWin.cancelAnimationFrame(rafId);
    visibleSet.clear();
  };
}

export function findBestMatchingTocPath(
  items: NavItem[],
  currentHref: string | null | undefined,
): NavItem[] | null {
  const current = getNormalizedHrefParts(currentHref);
  if (!current) return null;

  let bestPath: NavItem[] | null = null;
  let bestScore = -1;

  const visit = (entries: NavItem[], parents: NavItem[]) => {
    entries.forEach((item) => {
      const nextPath = [...parents, item];
      const score = getMatchScore(getNormalizedHrefParts(item.href), current);

      if (
        score >= 0 &&
        (score > bestScore ||
          (score === bestScore && nextPath.length > (bestPath?.length ?? 0)))
      ) {
        bestPath = nextPath;
        bestScore = score;
      }

      if ((item.subitems?.length ?? 0) > 0) {
        visit(item.subitems ?? [], nextPath);
      }
    });
  };

  visit(items, []);
  return bestPath;
}
