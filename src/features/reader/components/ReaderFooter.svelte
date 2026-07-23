<script lang="ts">
  import { readerState } from '@/stores/readerState.svelte'

  let rounded = $derived(Math.round(readerState.progress))
</script>

<footer class="bg-background/80 px-4 py-2 backdrop-blur-xl">
  <div class="flex items-center justify-between text-xs text-muted-foreground">
    <span class="max-w-[200px] truncate sm:max-w-[400px]">
      {readerState.currentChapter}
    </span>
    <span class="tabular-nums font-medium">{rounded}%</span>
  </div>
  <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/50">
    <div
      class="h-full rounded-full bg-foreground/20 transition-all duration-500 ease-out"
      style:width={`${rounded}%`}
    ></div>
  </div>
</footer>
