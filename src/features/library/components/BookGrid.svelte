<script lang="ts">
  import type { BookMeta } from '@/types/book'
  import BookCard from './BookCard.svelte'

  let { books, onDelete }: { books: BookMeta[]; onDelete: (id: string) => void } = $props()
</script>

<div class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
  {#each books as book (book.id)}
    <BookCard {book} {onDelete} />
  {/each}
</div>
