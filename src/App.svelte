<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import { getRoutePath, navigate, readRoute, subscribeRoute, type AppRoute } from './router'
  import { settingsState } from '@/stores/settingsState.svelte'

  let route = $state<AppRoute>(readRoute())

  async function loadPage(nextRoute: AppRoute): Promise<Component<{ bookId?: string }>> {
    if (nextRoute.name === 'reader') {
      return (await import('@/features/reader/components/ReaderPage.svelte'))
        .default as Component<{ bookId?: string }>
    }

    return (await import('@/features/library/components/LibraryPage.svelte'))
      .default as Component<{ bookId?: string }>
  }

  let pagePromise = $derived(loadPage(route))

  $effect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.toggle(
      'reader-sepia',
      settingsState.theme === 'sepia',
    )

    return () => document.documentElement.classList.remove('reader-sepia')
  })

  onMount(() => {
    if (getRoutePath() === '/') navigate('/library', { replace: true })
    return subscribeRoute((nextRoute) => {
      route = nextRoute
    })
  })
</script>

{#if route.name === 'not-found'}
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 class="text-xl font-semibold">Page not found</h1>
    <button
      type="button"
      class="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      onclick={() => navigate('/library')}
    >
      Back to Library
    </button>
  </main>
{:else}
  {#key route.name === 'reader' ? route.bookId : route.name}
    {#await pagePromise}
      <div class="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    {:then Page}
      {#if route.name === 'reader'}
        <Page bookId={route.bookId} />
      {:else}
        <Page />
      {/if}
    {:catch}
      <div class="flex min-h-screen items-center justify-center text-sm text-destructive">
        Failed to load page
      </div>
    {/await}
  {/key}
{/if}
