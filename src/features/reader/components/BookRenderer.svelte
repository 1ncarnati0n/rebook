<script lang="ts">
  import ePub, {
    type Book,
    type Contents,
    type Location,
    type NavItem,
    type Rendition,
  } from 'epubjs'
  import { readerState } from '@/stores/readerState.svelte'
  import { settingsState } from '@/stores/settingsState.svelte'
  import {
    getRenditionSpineProgress,
    navigateRenditionByChapter,
    normalizeArrowKey,
    scrollRenditionByDirection,
  } from '@/features/reader/lib/rendition-navigation'
  import {
    findBestMatchingTocPath,
    getTocItemLabel,
    observeTocSections,
  } from '@/features/reader/lib/toc'
  import {
    observeAndStripSandbox,
    patchEpubIframeSandbox,
  } from '@/features/reader/lib/patch-iframe-sandbox'

  interface Props {
    url: string
    initialLocation: string | null
    onProgressChange: (location: string, progress: number) => void
  }

  type RenditionLocationSource = Rendition & {
    currentLocation?: () =>
      | { href?: string }
      | Promise<{ href?: string }>
      | undefined
    location?: {
      start?: { href?: string }
      end?: { href?: string }
    }
    manager?: unknown
  }

  type ContentHookPayload = Contents & {
    document: Document
    window: Window
  }

  const THEME_COLORS = {
    light: { color: '#1a1a2e', background: '#ffffff' },
    sepia: { color: '#5b4636', background: '#f4ecd8' },
  } as const

  const FONT_URLS = [
    'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap',
    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
  ]

  let { url, initialLocation, onProgressChange }: Props = $props()
  let container: HTMLDivElement
  let viewer: HTMLDivElement
  let rendition = $state.raw<Rendition | null>(null)
  let tocItems: NavItem[] = []
  let lastDisplayedLocation: string | null = null
  let isReady = $state(false)
  let hasError = $state(false)

  let isScrolled = $derived(settingsState.viewMode === 'scrolled')
  let backgroundColor = $derived(THEME_COLORS[settingsState.theme].background)

  patchEpubIframeSandbox()

  function getCurrentRenditionHref(current: Rendition | null): string | null {
    if (!current) return null

    const source = current as RenditionLocationSource
    const rangeHref = source.location?.start?.href ?? source.location?.end?.href
    if (rangeHref) return rangeHref
    if (!source.manager || !source.currentLocation) return null

    try {
      const location = source.currentLocation()
      if (location && typeof location === 'object' && 'href' in location) {
        return location.href ?? null
      }
    } catch {
      // epub.js can throw before its manager is initialized.
    }

    return null
  }

  function getEventElement(target: EventTarget | null): Element | null {
    if (!target || typeof target !== 'object' || !('nodeType' in target)) return null

    const node = target as Node
    return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    const element = getEventElement(target)
    if (!element) return false

    const tagName = element.tagName.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true
    }
    if ((element as HTMLElement).isContentEditable) return true

    return Boolean(
      element.closest(
        'input, textarea, select, [contenteditable="true"], [role="slider"]',
      ),
    )
  }

  function handleArrowKey(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || isInteractiveTarget(event.target)) {
      return
    }

    const key = normalizeArrowKey(event.key)
    let handled = false

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      handled = scrollRenditionByDirection(
        rendition,
        container,
        key === 'ArrowDown' ? 'down' : 'up',
      )
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      handled = navigateRenditionByChapter(
        rendition,
        key === 'ArrowRight' ? 'next' : 'prev',
      )
    }

    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function applyStyles(
    current: Rendition,
    settings: {
      fontSize: number
      fontColor: string | null
      theme: keyof typeof THEME_COLORS
      lineHeight: number
      fontFamily: 'serif' | 'sans-serif'
    },
  ): void {
    const colors = THEME_COLORS[settings.theme]
    const fontStack =
      settings.fontFamily === 'serif'
        ? '"Noto Serif KR", Georgia, "Times New Roman", serif'
        : 'Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", -apple-system, "Helvetica Neue", sans-serif'

    current.themes.register('custom', {
      body: {
        'font-size': `${settings.fontSize}px !important`,
        'line-height': `${settings.lineHeight} !important`,
        'font-family': `${fontStack} !important`,
      },
      'p, div, span, li, td, th, h1, h2, h3, h4, h5, h6': {
        'font-size': 'inherit !important',
        'line-height': 'inherit !important',
        'font-family': 'inherit !important',
      },
    })
    current.themes.select('custom')
    current.themes.override('color', settings.fontColor ?? colors.color, true)
    current.themes.override('background', colors.background)
  }

  function syncCurrentTocState(current: Rendition): void {
    const currentHref = getCurrentRenditionHref(current)
    if (!currentHref) return

    const activeItem = findBestMatchingTocPath(tocItems, currentHref)?.at(-1)
    readerState.currentTocHref = activeItem?.href ?? currentHref
    readerState.currentChapter = activeItem
      ? getTocItemLabel(activeItem)
      : tocItems.length > 0
        ? ''
        : readerState.currentChapter
  }

  function handleRelocated(current: Rendition, location: Location): void {
    const cfi = location.start?.cfi
    if (!cfi) return

    lastDisplayedLocation = cfi
    readerState.currentLocation = cfi

    const progress = getRenditionSpineProgress(current)
    if (progress !== null) {
      readerState.progress = progress
      onProgressChange(cfi, progress)
    }

    syncCurrentTocState(current)
  }

  $effect(() => {
    const current = rendition
    const settings = {
      fontSize: settingsState.fontSize,
      fontColor: settingsState.fontColor,
      theme: settingsState.theme,
      lineHeight: settingsState.lineHeight,
      fontFamily: settingsState.fontFamily,
    }

    if (current) applyStyles(current, settings)
  })

  $effect(() => {
    const targetLocation = readerState.currentLocation
    const current = rendition

    if (!current || !targetLocation || targetLocation === lastDisplayedLocation) return
    void current.display(targetLocation).catch(() => undefined)
  })

  $effect(() => {
    window.addEventListener('keydown', handleArrowKey, {
      passive: false,
      capture: true,
    })

    return () => {
      window.removeEventListener('keydown', handleArrowKey, { capture: true })
    }
  })

  $effect(() => {
    const target = viewer
    const sandboxContainer = container
    const sourceUrl = url
    const viewMode = settingsState.viewMode
    if (!target || !sandboxContainer) return

    let cancelled = false
    let currentBook: Book | null = null
    let currentRendition: Rendition | null = null
    let sectionObserverCleanup: (() => void) | null = null
    const contentListenerCleanups: Array<() => void> = []
    const sandboxCleanup = observeAndStripSandbox(sandboxContainer)

    isReady = false
    hasError = false
    lastDisplayedLocation = null

    const initialize = async () => {
      currentBook = ePub(sourceUrl, { openAs: 'epub' })

      const handleOpenFailed = () => {
        if (!cancelled) hasError = true
      }
      currentBook.on('openFailed', handleOpenFailed)

      try {
        const navigation = await currentBook.loaded.navigation
        if (cancelled || !currentBook) return

        tocItems = navigation.toc
        readerState.toc = navigation.toc

        currentRendition = currentBook.renderTo(target, {
          width: '100%',
          height: '100%',
          manager: 'default',
          flow: viewMode === 'scrolled' ? 'scrolled' : 'paginated',
        })
        rendition = currentRendition

        currentRendition.on('displayerror', (error: unknown) => {
          const message = error instanceof Error ? error.message : String(error)
          if (!message.includes('startContainer') || !currentRendition) return

          lastDisplayedLocation = '0'
          readerState.currentLocation = '0'
          void currentRendition.display(0).catch(() => undefined)
        })

        currentRendition.hooks.content.register((rawContents: Contents) => {
          const contents = rawContents as ContentHookPayload
          const iframe = contents.document.defaultView?.frameElement
          if (iframe instanceof HTMLIFrameElement && iframe.hasAttribute('sandbox')) {
            iframe.removeAttribute('sandbox')
          }

          contents.window.addEventListener('keydown', handleArrowKey, {
            passive: false,
            capture: true,
          })
          contents.document.addEventListener('keydown', handleArrowKey, {
            passive: false,
            capture: true,
          })
          contentListenerCleanups.push(() => {
            contents.window.removeEventListener('keydown', handleArrowKey, {
              capture: true,
            })
            contents.document.removeEventListener('keydown', handleArrowKey, {
              capture: true,
            })
          })

          for (const href of FONT_URLS) {
            if (contents.document.head.querySelector(`link[data-rebook-font="${href}"]`)) {
              continue
            }

            const link = contents.document.createElement('link')
            link.rel = 'stylesheet'
            link.href = href
            link.dataset.rebookFont = href
            contents.document.head.appendChild(link)
          }

          const html = contents.document.documentElement
          const body = contents.document.body
          const lang = html.getAttribute('lang') || body.getAttribute('lang') || 'auto'
          html.setAttribute('translate', 'yes')
          html.setAttribute('lang', lang)
          body.setAttribute('translate', 'yes')
          if (!body.getAttribute('lang')) body.setAttribute('lang', lang)

          sectionObserverCleanup?.()
          sectionObserverCleanup = observeTocSections(
            contents.document,
            contents.window,
            tocItems,
            getCurrentRenditionHref(currentRendition),
            (href) => {
              readerState.currentTocHref = href
            },
          )
        })

        currentRendition.on('relocated', (location: Location) => {
          if (currentRendition) handleRelocated(currentRendition, location)
        })

        applyStyles(currentRendition, {
          fontSize: settingsState.fontSize,
          fontColor: settingsState.fontColor,
          theme: settingsState.theme,
          lineHeight: settingsState.lineHeight,
          fontFamily: settingsState.fontFamily,
        })

        const location = readerState.currentLocation || initialLocation || 0
        if (typeof location === 'number') {
          await currentRendition.display(location)
        } else {
          await currentRendition.display(location)
        }
        if (!cancelled) isReady = true
      } catch {
        if (!cancelled) hasError = true
      }
    }

    void initialize()

    return () => {
      cancelled = true
      sandboxCleanup()
      sectionObserverCleanup?.()
      contentListenerCleanups.forEach((cleanup) => cleanup())
      if (rendition === currentRendition) rendition = null
      currentBook?.destroy()
      currentBook = null
      currentRendition = null
    }
  })
</script>

<div
  bind:this={container}
  class="relative h-full w-full overflow-hidden transition-colors duration-300"
  style:background-color={backgroundColor}
>
  <div bind:this={viewer} class:scrolled={isScrolled} class="reader-view"></div>

  {#if !isScrolled}
    <button
      type="button"
      class="reader-arrow left-px"
      aria-label="Previous page"
      onclick={() => void rendition?.prev()}
    >‹</button>
    <button
      type="button"
      class="reader-arrow right-px"
      aria-label="Next page"
      onclick={() => void rendition?.next()}
    >›</button>
  {/if}

  {#if !isReady && !hasError}
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  {:else if hasError}
    <div class="absolute inset-0 flex items-center justify-center text-sm text-destructive">
      Error loading book
    </div>
  {/if}
</div>

<style>
  .reader-view {
    position: absolute;
    inset: 50px 50px 20px;
  }

  .reader-view.scrolled {
    inset: 20px auto 20px 50%;
    width: calc(100% - 48px);
    max-width: 720px;
    transform: translateX(-50%);
  }

  .reader-arrow {
    position: absolute;
    top: 50%;
    margin-top: -32px;
    border: 0;
    padding: 0 10px;
    background: none;
    color: #e2e2e2;
    font-family: Arial, sans-serif;
    font-size: 64px;
    font-weight: 400;
    line-height: 1;
    cursor: pointer;
    user-select: none;
  }

  .reader-arrow:hover,
  .reader-arrow:focus-visible {
    color: #777;
  }
</style>
