<script lang="ts">
  import { onMount } from 'svelte'
  import { BookOpen, ChevronDown } from 'lucide-svelte'
  import { bookRepository } from '@/db/bookRepository'
  import { fileToArrayBuffer, isEpubFile } from '@/lib/storage'
  import { navigate } from '@/router'
  import type { BookMeta, BookRecord } from '@/types/book'
  import BookGrid from './BookGrid.svelte'
  import EmptyLibrary from './EmptyLibrary.svelte'
  import FileUploadZone from './FileUploadZone.svelte'

  type SortBy = 'lastReadAt' | 'addedAt' | 'title'

  let books = $state<BookMeta[]>([])
  let sortBy = $state<SortBy>('lastReadAt')
  let isUploading = $state(false)
  let isDragOver = $state(false)
  const sortedBooks = $derived(
    [...books].sort((a, b) =>
      sortBy === 'title' ? a.title.localeCompare(b.title) : b[sortBy] - a[sortBy],
    ),
  )

  onMount(() => {
    let active = true
    void bookRepository.getAllMeta().then((loadedBooks) => {
      if (active) books = loadedBooks
    })
    return () => {
      active = false
    }
  })

  async function uploadBook(file: File): Promise<void> {
    if (!isEpubFile(file)) return

    isUploading = true
    try {
      const arrayBuffer = await fileToArrayBuffer(file)
      const { extractEpubMetadata } = await import('@/lib/epub-utils')
      const metadata = await extractEpubMetadata(arrayBuffer)
      const id = crypto.randomUUID()
      const now = Date.now()
      const book: BookRecord = {
        id,
        title: metadata.title,
        author: metadata.author,
        addedAt: now,
        lastReadAt: now,
        progress: 0,
        fileSize: file.size,
        fileData: arrayBuffer,
        coverData: metadata.coverData,
      }

      await bookRepository.addBook(book)
      books = [
        {
          id,
          title: book.title,
          author: book.author,
          addedAt: now,
          lastReadAt: now,
          progress: 0,
          fileSize: file.size,
        },
        ...books,
      ]
      navigate(`/reader/${id}`)
    } finally {
      isUploading = false
    }
  }

  async function deleteBook(id: string): Promise<void> {
    await bookRepository.deleteBook(id)
    books = books.filter((book) => book.id !== id)
  }
</script>

<svelte:window
  ondragover={(event) => {
    event.preventDefault()
    isDragOver = true
  }}
  ondragleave={(event) => {
    // relatedTarget === null means the pointer left the window, not just a child element
    if (!event.relatedTarget) isDragOver = false
  }}
  ondrop={(event) => {
    event.preventDefault()
    isDragOver = false
    if (isUploading) return
    // ponytail: first file only, uploadBook navigates away immediately
    const file = event.dataTransfer?.files[0]
    if (file) void uploadBook(file)
  }}
/>

{#if isDragOver}
  <div
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
  >
    <div
      class="rounded-2xl border-2 border-dashed border-foreground/30 px-10 py-8 text-sm font-medium"
    >
      Drop EPUB file here
    </div>
  </div>
{/if}

{#if books.length === 0}
  <div class="flex min-h-screen flex-col bg-background">
    <header class="flex items-center gap-3 px-6 py-5">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
        <BookOpen class="h-4.5 w-4.5 text-background" />
      </div>
      <h1 class="text-xl font-bold tracking-tight">Rebook</h1>
    </header>
    <EmptyLibrary onUpload={uploadBook} {isUploading} />
  </div>
{:else}
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-10 bg-background/80 backdrop-blur-xl">
      <div class="flex items-center justify-between px-6 py-5">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
            <BookOpen class="h-4.5 w-4.5 text-background" />
          </div>
          <h1 class="text-xl font-bold tracking-tight">Rebook</h1>
        </div>

        <div class="flex items-center gap-2">
          <label class="relative">
            <span class="sr-only">Sort books</span>
            <select
              bind:value={sortBy}
              class="appearance-none rounded-xl bg-transparent py-2 pl-3 pr-8 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <option value="lastReadAt">Last Read</option>
              <option value="addedAt">Date Added</option>
              <option value="title">Title</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </label>
          <FileUploadZone onUpload={uploadBook} {isUploading} compact />
        </div>
      </div>
    </header>

    <main class="px-6 pb-8">
      <BookGrid books={sortedBooks} onDelete={deleteBook} />
    </main>
  </div>
{/if}
