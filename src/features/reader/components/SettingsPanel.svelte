<script lang="ts">
  import { BookOpen, Minus, Plus, ScrollText, X } from 'lucide-svelte'
  import { settingsState } from '@/stores/settingsState.svelte'
  import type { ReaderTheme, ViewMode } from '@/types/settings'

  interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
  }

  const themes: { value: ReaderTheme; label: string; color: string; bg: string; border: string }[] = [
    { value: 'light', label: 'Light', color: '#1a1a2e', bg: '#ffffff', border: '#e5e5e5' },
    { value: 'sepia', label: 'Sepia', color: '#5b4636', bg: '#f4ecd8', border: '#d4c4a8' },
  ]

  const viewModes: { value: ViewMode; label: string }[] = [
    { value: 'paginated', label: 'Page' },
    { value: 'scrolled', label: 'Scroll' },
  ]

  let { open, onOpenChange }: Props = $props()
  let dialog: HTMLDialogElement
  let defaultFontColor = $derived(
    themes.find((theme) => theme.value === settingsState.theme)?.color ?? themes[0].color,
  )
  let displayedFontColor = $derived(settingsState.fontColor ?? defaultFontColor)

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="reader-settings-title"
  class="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[340px] max-w-[calc(100vw-2rem)] overflow-y-auto border-0 bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/40"
  onclose={() => open && onOpenChange(false)}
  onclick={(event) => event.target === dialog && onOpenChange(false)}
>
  <div class="min-h-full">
    <header class="flex items-center justify-between px-5 pt-5">
      <h2 id="reader-settings-title" class="text-base font-semibold tracking-tight">Settings</h2>
      <button
        type="button"
        aria-label="Close settings"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        onclick={() => onOpenChange(false)}
      >
        <X class="h-4 w-4" />
      </button>
    </header>
    <p class="sr-only">Adjust reader settings such as view mode, font, and theme.</p>

    <div class="mt-6 space-y-7 px-5 pb-8">
      <section>
        <span class="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          View Mode
        </span>
        <div class="grid grid-cols-2 gap-2">
          {#each viewModes as mode (mode.value)}
            <button
              type="button"
              aria-pressed={settingsState.viewMode === mode.value}
              onclick={() => settingsState.setViewMode(mode.value)}
              class={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                settingsState.viewMode === mode.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {#if mode.value === 'paginated'}
                <BookOpen class="h-4 w-4" />
              {:else}
                <ScrollText class="h-4 w-4" />
              {/if}
              {mode.label}
            </button>
          {/each}
        </div>
      </section>

      <section>
        <div class="mb-3 flex items-center justify-between">
          <label for="reader-font-size" class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Font Size
          </label>
          <span class="tabular-nums text-sm font-medium">{settingsState.fontSize}px</span>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease font size"
            onclick={() => settingsState.setFontSize(Math.max(12, settingsState.fontSize - 1))}
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
          >
            <Minus class="h-3.5 w-3.5" />
          </button>
          <input
            id="reader-font-size"
            type="range"
            min="12"
            max="28"
            step="1"
            value={settingsState.fontSize}
            oninput={(event) => settingsState.setFontSize(Number(event.currentTarget.value))}
            class="h-2 flex-1 cursor-pointer accent-foreground"
          />
          <button
            type="button"
            aria-label="Increase font size"
            onclick={() => settingsState.setFontSize(Math.min(28, settingsState.fontSize + 1))}
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
          >
            <Plus class="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <section>
        <div class="mb-3 flex items-center justify-between">
          <label for="reader-line-height" class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Line Height
          </label>
          <span class="tabular-nums text-sm font-medium">{settingsState.lineHeight.toFixed(1)}</span>
        </div>
        <input
          id="reader-line-height"
          type="range"
          min="1.2"
          max="2"
          step="0.1"
          value={settingsState.lineHeight}
          oninput={(event) => settingsState.setLineHeight(Number(event.currentTarget.value))}
          class="h-2 w-full cursor-pointer accent-foreground"
        />
      </section>

      <section>
        <span class="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Typeface
        </span>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={settingsState.fontFamily === 'serif'}
            onclick={() => settingsState.setFontFamily('serif')}
            class={`rounded-xl px-4 py-3 text-sm transition-all ${
              settingsState.fontFamily === 'serif'
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <span class="block font-serif text-lg leading-none">Aa</span>
            <span class="mt-1 block text-xs">Serif</span>
          </button>
          <button
            type="button"
            aria-pressed={settingsState.fontFamily === 'sans-serif'}
            onclick={() => settingsState.setFontFamily('sans-serif')}
            class={`rounded-xl px-4 py-3 text-sm transition-all ${
              settingsState.fontFamily === 'sans-serif'
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <span class="block text-lg font-light leading-none">Aa</span>
            <span class="mt-1 block text-xs">Sans</span>
          </button>
        </div>
      </section>

      <section>
        <div class="mb-3 flex items-center justify-between">
          <label for="reader-font-color" class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Font Color
          </label>
          <span class="font-mono text-xs uppercase text-muted-foreground">{displayedFontColor}</span>
        </div>
        <div class="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <input
            id="reader-font-color"
            type="color"
            value={displayedFontColor}
            oninput={(event) => settingsState.setFontColor(event.currentTarget.value)}
            class="color-picker h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border bg-transparent p-0"
          />
          <div class="min-w-0 flex-1">
            <span class="block text-sm font-medium">
              {settingsState.fontColor ? 'Custom color' : 'Theme default'}
            </span>
            <span class="block text-xs text-muted-foreground">EPUB text only</span>
          </div>
          <button
            type="button"
            aria-label="Reset font color to theme default"
            disabled={settingsState.fontColor === null}
            onclick={() => settingsState.setFontColor(null)}
            class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </section>

      <section>
        <span class="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reader Theme
        </span>
        <div class="flex gap-3">
          {#each themes as theme (theme.value)}
            <button
              type="button"
              aria-pressed={settingsState.theme === theme.value}
              onclick={() => settingsState.setTheme(theme.value)}
              class={`flex flex-1 flex-col items-center gap-2 rounded-xl p-3 transition-all ${
                settingsState.theme === theme.value
                  ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                  : 'hover:bg-muted/50'
              }`}
            >
              <span
                class="h-10 w-10 rounded-full shadow-inner"
                style:background-color={theme.bg}
                style:border={`2px solid ${theme.border}`}
              ></span>
              <span class="text-xs font-medium">{theme.label}</span>
            </button>
          {/each}
        </div>
      </section>
    </div>
  </div>
</dialog>

<style>
  .color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-picker::-webkit-color-swatch,
  .color-picker::-moz-color-swatch {
    border: 0;
    border-radius: 9999px;
  }
</style>
