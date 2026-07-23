<script lang="ts">
  import { onDestroy, tick } from 'svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import {
    Bookmark as BookmarkIcon,
    Check,
    ChevronDown,
    ChevronRight,
    List,
    Pencil,
    Trash2,
    X,
  } from 'lucide-svelte'
  import { readerState } from '@/stores/readerState.svelte'
  import type { BookmarkRecord } from '@/types/bookmark'
  import type { NavItem } from 'epubjs'
  import { findBestMatchingTocPath, getTocItemLabel } from '@/features/reader/lib/toc'

  const MIN_WIDTH = 200
  const MAX_WIDTH = 480

  interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onNavigate: (href: string, chapterName?: string) => void
    bookmarks: BookmarkRecord[]
    onUpdateBookmark: (id: string, chapterName: string) => void
    onRemoveBookmark: (id: string) => void
  }

  let {
    open,
    onOpenChange,
    onNavigate,
    bookmarks,
    onUpdateBookmark,
    onRemoveBookmark,
  }: Props = $props()

  let activeTab = $state<'toc' | 'bookmarks'>('toc')
  let width = $state(280)
  const collapsedKeys = new SvelteSet<string>()
  let editingId = $state<string | null>(null)
  let draft = $state('')
  let editInput = $state<HTMLInputElement | null>(null)
  let content: HTMLDivElement | null = null
  let resizing = false
  let resizeStartX = 0
  let resizeStartWidth = 0

  let activeTocPath = $derived(findBestMatchingTocPath(readerState.toc, readerState.currentTocHref))
  let activeTocItem = $derived(activeTocPath?.at(-1) ?? null)

  $effect(() => {
    if (!open || !activeTocItem || !content) return
    void tick().then(() => {
      content?.querySelector<HTMLElement>('[aria-current="location"]')?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    })
  })

  function getTocLabelClass(isActive: boolean, depth: number): string {
    if (isActive) return 'font-bold text-foreground'
    if (depth === 0) return 'font-medium text-foreground'
    return 'text-muted-foreground'
  }

  function toggleCollapsed(key: string): void {
    if (collapsedKeys.has(key)) collapsedKeys.delete(key)
    else collapsedKeys.add(key)
  }

  function beginEditing(bookmark: BookmarkRecord): void {
    editingId = bookmark.id
    draft = bookmark.chapterName
    void tick().then(() => {
      editInput?.focus()
      editInput?.select()
    })
  }

  function cancelEditing(bookmark: BookmarkRecord): void {
    draft = bookmark.chapterName
    editingId = null
  }

  function saveBookmark(bookmark: BookmarkRecord): void {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== bookmark.chapterName) onUpdateBookmark(bookmark.id, trimmed)
    else draft = bookmark.chapterName
    editingId = null
  }

  function startResize(event: PointerEvent): void {
    resizing = true
    resizeStartX = event.clientX
    resizeStartWidth = width
    ;(event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function resize(event: PointerEvent): void {
    if (!resizing) return
    width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidth + event.clientX - resizeStartX))
  }

  function stopResize(): void {
    resizing = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  function resizeWithKeyboard(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const delta = event.key === 'ArrowLeft' ? -10 : 10
    width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width + delta))
  }

  onDestroy(stopResize)
</script>

{#snippet tocItem(item: NavItem, depth: number)}
  {@const hasChildren = Boolean(item.subitems?.length)}
  {@const label = getTocItemLabel(item)}
  {@const isActive = activeTocItem === item}
  {@const key = `${depth}:${item.href}:${item.label}`}
  {@const expanded = !collapsedKeys.has(key)}
  <div>
    <div
      class="group flex w-full items-center gap-1 rounded-lg py-1.5 pr-2 text-sm transition-colors hover:bg-muted/70"
      style:padding-left={`${8 + depth * 16}px`}
    >
      {#if hasChildren}
        <button
          type="button"
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
          aria-expanded={expanded}
          class="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted"
          onclick={() => toggleCollapsed(key)}
        >
          {#if expanded}
            <ChevronDown class="h-3 w-3" />
          {:else}
            <ChevronRight class="h-3 w-3" />
          {/if}
        </button>
      {:else}
        <span class="w-4 shrink-0"></span>
      {/if}
      <button
        type="button"
        aria-current={isActive ? 'location' : undefined}
        class={`min-w-0 flex-1 truncate text-left leading-snug ${getTocLabelClass(isActive, depth)}`}
        onclick={() => onNavigate(item.href, label)}
      >
        {label}
      </button>
    </div>
    {#if hasChildren && expanded}
      <div>
        {#each item.subitems ?? [] as child (`${child.href}-${child.label}`)}
          {@render tocItem(child, depth + 1)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

<aside
  class={`relative flex h-full shrink-0 flex-col border-r bg-background ${open ? '' : 'w-0 overflow-hidden'}`}
  style:width={open ? `${width}px` : undefined}
  aria-hidden={!open}
  inert={!open}
>
  <div class="flex items-center justify-between px-3 pt-3 pb-1">
    <div class="flex gap-1 rounded-lg bg-muted/50 p-0.5">
      <button
        type="button"
        aria-pressed={activeTab === 'toc'}
        onclick={() => (activeTab = 'toc')}
        class={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
          activeTab === 'toc'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <List class="h-3 w-3" />
        Contents
      </button>
      <button
        type="button"
        aria-pressed={activeTab === 'bookmarks'}
        onclick={() => (activeTab = 'bookmarks')}
        class={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
          activeTab === 'bookmarks'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <BookmarkIcon class="h-3 w-3" />
        Bookmarks
        {#if bookmarks.length > 0}
          <span class="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/10 px-1 text-[10px] font-semibold">
            {bookmarks.length}
          </span>
        {/if}
      </button>
    </div>
    <button
      type="button"
      aria-label="Close table of contents"
      class="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      onclick={() => onOpenChange(false)}
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>

  <div bind:this={content} class="flex-1 overflow-y-auto px-2 pb-4 pt-1">
    {#if activeTab === 'toc'}
      <nav class="space-y-px" aria-label="Table of contents">
        {#each readerState.toc as item (`${item.href}-${item.label}`)}
          {@render tocItem(item, 0)}
        {/each}
        {#if readerState.toc.length === 0}
          <p class="py-12 text-center text-sm text-muted-foreground">No table of contents</p>
        {/if}
      </nav>
    {:else}
      <div class="space-y-0.5">
        {#each bookmarks as bookmark (bookmark.id)}
          <div class="group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/70">
            {#if editingId === bookmark.id}
              <input
                bind:this={editInput}
                bind:value={draft}
                aria-label="Bookmark name"
                onkeydown={(event) => {
                  if (event.key === 'Enter') saveBookmark(bookmark)
                  if (event.key === 'Escape') cancelEditing(bookmark)
                }}
                onblur={() => saveBookmark(bookmark)}
                class="min-w-0 flex-1 rounded-md border bg-background px-1.5 py-0.5 text-sm font-medium leading-snug outline-none focus:ring-1 focus:ring-ring"
              />
            {:else}
              <button
                type="button"
                class="min-w-0 flex-1 text-left"
                onclick={() => onNavigate(bookmark.cfi)}
              >
                <p class="text-sm font-medium leading-snug">{bookmark.chapterName || 'Bookmark'}</p>
                {#if bookmark.excerpt}
                  <p class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {bookmark.excerpt}
                  </p>
                {/if}
                <p class="mt-1 text-[11px] text-muted-foreground/60">
                  {new Date(bookmark.createdAt).toLocaleDateString()}
                </p>
              </button>
            {/if}
            <div class="mt-0.5 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {#if editingId === bookmark.id}
                <button
                  type="button"
                  aria-label="Save bookmark name"
                  onmousedown={(event) => event.preventDefault()}
                  onclick={() => saveBookmark(bookmark)}
                  class="rounded-lg p-1.5 hover:bg-muted"
                >
                  <Check class="h-3 w-3 text-primary" />
                </button>
              {:else}
                <button
                  type="button"
                  aria-label="Edit bookmark name"
                  onclick={() => beginEditing(bookmark)}
                  class="rounded-lg p-1.5 hover:bg-muted"
                >
                  <Pencil class="h-3 w-3 text-muted-foreground" />
                </button>
              {/if}
              <button
                type="button"
                aria-label="Delete bookmark"
                onclick={() => onRemoveBookmark(bookmark.id)}
                class="rounded-lg p-1.5 hover:bg-destructive/10"
              >
                <Trash2 class="h-3 w-3 text-destructive" />
              </button>
            </div>
          </div>
        {/each}
        {#if bookmarks.length === 0}
          <p class="py-12 text-center text-sm text-muted-foreground">No bookmarks yet</p>
        {/if}
      </div>
    {/if}
  </div>

  <button
    type="button"
    aria-label="Resize table of contents"
    class="absolute top-0 right-0 z-10 flex h-full w-2 translate-x-1/2 cursor-col-resize items-center justify-center opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
    onpointerdown={startResize}
    onpointermove={resize}
    onpointerup={stopResize}
    onlostpointercapture={stopResize}
    onkeydown={resizeWithKeyboard}
  >
    <span class="h-8 w-1 rounded-full bg-muted-foreground/30"></span>
  </button>
</aside>
