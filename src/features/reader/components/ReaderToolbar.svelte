<script lang="ts">
  import { ArrowLeft, Bookmark, BookmarkCheck, List, Settings } from 'lucide-svelte'
  import { navigate } from '@/router'

  interface Props {
    title: string
    onToggleToc: () => void
    onToggleSettings: () => void
    onToggleBookmark: () => void
    isBookmarked: boolean
    isTocOpen?: boolean
  }

  let {
    title,
    onToggleToc,
    onToggleSettings,
    onToggleBookmark,
    isBookmarked,
    isTocOpen = false,
  }: Props = $props()
</script>

<header class="flex h-14 items-center justify-between bg-background/80 px-2 backdrop-blur-xl sm:px-4">
  <div class="flex items-center gap-1">
    <button
      type="button"
      aria-label="Back to library"
      class="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
      onclick={() => navigate('/library')}
    >
      <ArrowLeft class="h-[18px] w-[18px]" />
    </button>
    <div class="ml-1 flex flex-col">
      <h1 class="max-w-[180px] truncate text-sm font-semibold leading-tight sm:max-w-[400px]">
        {title}
      </h1>
    </div>
  </div>

  <div class="flex items-center gap-0.5">
    <button
      type="button"
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      class="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
      onclick={onToggleBookmark}
    >
      {#if isBookmarked}
        <BookmarkCheck class="h-[18px] w-[18px] text-primary" />
      {:else}
        <Bookmark class="h-[18px] w-[18px]" />
      {/if}
    </button>
    <button
      type="button"
      aria-label="Toggle table of contents"
      aria-pressed={isTocOpen}
      class={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted ${isTocOpen ? 'bg-muted' : ''}`}
      onclick={onToggleToc}
    >
      <List class="h-[18px] w-[18px]" />
    </button>
    <button
      type="button"
      aria-label="Open reader settings"
      class="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
      onclick={onToggleSettings}
    >
      <Settings class="h-[18px] w-[18px]" />
    </button>
  </div>
</header>
