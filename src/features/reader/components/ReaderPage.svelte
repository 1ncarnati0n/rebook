<script lang="ts">
  import { LoaderCircle } from 'lucide-svelte'
  import { bookRepository } from '@/db/bookRepository'
  import { bookmarkRepository } from '@/db/bookmarkRepository'
  import { arrayBufferToUrl } from '@/lib/storage'
  import { navigate } from '@/router'
  import { readerState } from '@/stores/readerState.svelte'
  import type { BookRecord } from '@/types/book'
  import type { BookmarkRecord } from '@/types/bookmark'
  import BookRenderer from './BookRenderer.svelte'
  import ReaderFooter from './ReaderFooter.svelte'
  import ReaderToolbar from './ReaderToolbar.svelte'
  import SettingsPanel from './SettingsPanel.svelte'
  import TableOfContents from './TableOfContents.svelte'

  interface Props {
    bookId: string
  }

  let { bookId }: Props = $props()
  let bookUrl = $state<string | null>(null)
  let book = $state.raw<BookRecord | null>(null)
  let error = $state<string | null>(null)
  let bookmarks = $state.raw<BookmarkRecord[]>([])
  let tocOpen = $state(false)
  let settingsOpen = $state(false)
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let pendingProgress: { location: string; progress: number } | null = null

  function flushPendingProgress(targetBookId: string): void {
    const pending = pendingProgress
    if (!pending) return

    void bookRepository
      .updateProgress(targetBookId, pending.location, pending.progress)
      .then(() => {
        if (pendingProgress === pending) pendingProgress = null
      })
      .catch(() => {})
  }

  function saveProgress(location: string, progress: number): void {
    pendingProgress = { location, progress }
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      flushPendingProgress(bookId)
    }, 1000)
  }

  async function addBookmark(cfi: string, chapterName: string, excerpt?: string): Promise<void> {
    const targetBookId = bookId
    if (await bookmarkRepository.findByCfi(targetBookId, cfi)) return

    const bookmark: BookmarkRecord = {
      id: crypto.randomUUID(),
      bookId: targetBookId,
      cfi,
      chapterName,
      excerpt,
      createdAt: Date.now(),
    }

    await bookmarkRepository.add(bookmark)
    if (targetBookId === bookId) bookmarks = [bookmark, ...bookmarks]
  }

  async function updateBookmark(id: string, chapterName: string): Promise<void> {
    await bookmarkRepository.update(id, { chapterName })
    bookmarks = bookmarks.map((bookmark) =>
      bookmark.id === id ? { ...bookmark, chapterName } : bookmark,
    )
  }

  async function removeBookmark(id: string): Promise<void> {
    await bookmarkRepository.remove(id)
    bookmarks = bookmarks.filter((bookmark) => bookmark.id !== id)
  }

  function toggleBookmark(): void {
    const location = readerState.currentLocation
    if (!location) return

    const existing = bookmarks.find((bookmark) => bookmark.cfi === location)
    if (existing) void removeBookmark(existing.id)
    else void addBookmark(location, readerState.currentChapter || 'Bookmark')
  }

  function handleNavigate(href: string, chapterName?: string): void {
    readerState.currentLocation = href
    readerState.currentTocHref = href
    if (chapterName) readerState.currentChapter = chapterName
  }

  $effect(() => {
    const targetBookId = bookId
    let cancelled = false
    let blobUrl: string | null = null

    readerState.reset()
    error = null
    book = null
    bookUrl = null
    bookmarks = []

    const loadBook = async () => {
      try {
        const record = await bookRepository.getBook(targetBookId)
        if (cancelled) return
        if (!record) {
          error = 'Book not found'
          return
        }

        book = record
        blobUrl = arrayBufferToUrl(record.fileData)
        bookUrl = blobUrl
        if (record.lastLocation) readerState.currentLocation = record.lastLocation
      } catch {
        if (!cancelled) error = 'Failed to load book'
      } finally {
        if (!cancelled) readerState.isLoading = false
      }
    }

    void loadBook()
    void bookmarkRepository.getByBookId(targetBookId).then((loadedBookmarks) => {
      if (!cancelled) bookmarks = loadedBookmarks
    })

    return () => {
      cancelled = true
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      flushPendingProgress(targetBookId)
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  })

  let isCurrentLocationBookmarked = $derived(
    readerState.currentLocation !== null &&
      bookmarks.some((bookmark) => bookmark.cfi === readerState.currentLocation),
  )
</script>

{#if error}
  <div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
    <div class="text-center">
      <p class="text-lg font-medium text-destructive">{error}</p>
      <p class="mt-1 text-sm text-muted-foreground">The book could not be loaded</p>
    </div>
    <button
      type="button"
      onclick={() => navigate('/library')}
      class="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      Back to Library
    </button>
  </div>
{:else if readerState.isLoading || !bookUrl || !book}
  <div class="flex min-h-screen items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <LoaderCircle class="h-8 w-8 animate-spin text-muted-foreground/50" />
      <span class="text-sm text-muted-foreground">Loading book...</span>
    </div>
  </div>
{:else}
  <div class="flex h-screen flex-col overflow-hidden bg-background">
    <ReaderToolbar
      title={book.title}
      onToggleToc={() => (tocOpen = !tocOpen)}
      isTocOpen={tocOpen}
      onToggleSettings={() => (settingsOpen = true)}
      onToggleBookmark={toggleBookmark}
      isBookmarked={isCurrentLocationBookmarked}
    />

    <div class="relative flex min-h-0 flex-1">
      <TableOfContents
        open={tocOpen}
        onOpenChange={(open) => (tocOpen = open)}
        onNavigate={handleNavigate}
        {bookmarks}
        onUpdateBookmark={(id, chapterName) => void updateBookmark(id, chapterName)}
        onRemoveBookmark={(id) => void removeBookmark(id)}
      />
      <main class="relative min-h-0 flex-1">
        <BookRenderer
          url={bookUrl}
          initialLocation={book.lastLocation ?? null}
          onProgressChange={saveProgress}
        />
      </main>
    </div>

    <ReaderFooter />

    <SettingsPanel
      open={settingsOpen}
      onOpenChange={(open) => (settingsOpen = open)}
    />
  </div>
{/if}
