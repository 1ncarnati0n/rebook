<script lang="ts">
  import { onMount } from 'svelte'
  import { BookOpen, Trash2 } from 'lucide-svelte'
  import { bookRepository } from '@/db/bookRepository'
  import { formatFileSize } from '@/lib/storage'
  import { navigate } from '@/router'
  import type { BookMeta } from '@/types/book'

  let { book, onDelete }: { book: BookMeta; onDelete: (id: string) => void } = $props()
  let coverUrl = $state<string | null>(null)
  const rounded = $derived(Math.round(book.progress))

  onMount(() => {
    let active = true
    let objectUrl: string | null = null

    void bookRepository
      .getCover(book.id)
      .then((blob) => {
        if (!blob || !active) return
        objectUrl = URL.createObjectURL(blob)
        coverUrl = objectUrl
      })
      .catch(() => {})

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  })

  function openBook(): void {
    navigate(`/reader/${book.id}`)
  }

</script>

<div class="group relative">
  <button type="button" class="block w-full cursor-pointer text-left" onclick={openBook}>
    <div class="relative aspect-[2/3] overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/5">
      {#if coverUrl}
        <img
          src={coverUrl}
          alt={book.title}
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      {:else}
        <div class="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/5">
          <BookOpen class="h-10 w-10 text-muted-foreground/20" />
        </div>
      {/if}

      {#if rounded > 0}
        <div class="absolute inset-x-0 bottom-0">
          <div class="h-1 bg-black/10">
            <div class="h-full bg-white/80 transition-all duration-500" style:width={`${rounded}%`}></div>
          </div>
        </div>
      {/if}
    </div>

    <div class="mt-2.5 px-0.5">
      <h3 class="truncate text-sm font-semibold leading-snug">{book.title}</h3>
      <p class="mt-0.5 truncate text-xs text-muted-foreground">{book.author}</p>
      <div class="mt-1 flex items-center gap-1.5">
        {#if rounded > 0}
          <span class="text-[11px] font-medium text-muted-foreground/70">{rounded}%</span>
        {/if}
        <span class="text-[11px] text-muted-foreground/50">{formatFileSize(book.fileSize)}</span>
      </div>
    </div>
  </button>

  <button
    type="button"
    aria-label={`Delete ${book.title}`}
    onclick={() => onDelete(book.id)}
    class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-destructive focus:opacity-100"
  >
    <Trash2 class="h-3 w-3" />
  </button>
</div>
