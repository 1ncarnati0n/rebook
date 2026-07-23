<script lang="ts">
  import { BookOpen } from 'lucide-svelte'
  import FileUploadZone from './FileUploadZone.svelte'

  let {
    onUpload,
    isUploading,
  }: { onUpload: (file: File) => void; isUploading: boolean } = $props()
</script>

<div class="flex flex-1 flex-col items-center justify-center px-4">
  <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50">
    <BookOpen class="h-9 w-9 text-muted-foreground/40" />
  </div>
  <h2 class="mb-1.5 text-xl font-semibold tracking-tight">Your library is empty</h2>
  <p class="mb-10 text-sm text-muted-foreground">Drop an EPUB file to start reading</p>
  <div class="w-full max-w-sm">
    <FileUploadZone {onUpload} {isUploading} />
  </div>
</div>
