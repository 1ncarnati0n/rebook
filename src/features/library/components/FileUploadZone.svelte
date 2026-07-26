<script lang="ts">
  import { Loader2, Plus, Upload } from 'lucide-svelte'

  let {
    onUpload,
    isUploading,
    compact = false,
  }: {
    onUpload: (file: File) => void
    isUploading: boolean
    compact?: boolean
  } = $props()

  let input = $state<HTMLInputElement>()

  function openPicker(): void {
    if (!isUploading) input?.click()
  }

  function handleFileSelect(event: Event): void {
    const target = event.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (file) onUpload(file)
    target.value = ''
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openPicker()
  }
</script>

{#if compact}
  <button
    type="button"
    onclick={openPicker}
    disabled={isUploading}
    class="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
  >
    {#if isUploading}
      <Loader2 class="h-3.5 w-3.5 animate-spin" />
    {:else}
      <Plus class="h-3.5 w-3.5" />
    {/if}
    Add
  </button>
  <input bind:this={input} type="file" accept=".epub" onchange={handleFileSelect} class="hidden" />
{:else}
  <div
    role="button"
    tabindex="0"
    onclick={openPicker}
    onkeydown={handleKeydown}
    class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/15 px-8 py-14 transition-all hover:border-foreground/20 hover:bg-muted/30"
  >
    {#if isUploading}
      <Loader2 class="mb-3 h-8 w-8 animate-spin text-muted-foreground/50" />
    {:else}
      <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
        <Upload class="h-5 w-5 text-muted-foreground/50" />
      </div>
    {/if}
    <p class="text-sm font-medium">{isUploading ? 'Processing...' : 'Drop EPUB file here'}</p>
    <p class="mt-1 text-xs text-muted-foreground">or click to browse</p>
    <input bind:this={input} type="file" accept=".epub" onchange={handleFileSelect} class="hidden" />
  </div>
{/if}
