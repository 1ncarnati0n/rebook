export type AppRoute =
  | { name: 'library' }
  | { name: 'reader'; bookId: string }
  | { name: 'not-found' }

const NAVIGATE_EVENT = 'rebook:navigate'
const isExtension = window.location.protocol === 'chrome-extension:'

export function getRoutePath(): string {
  if (!isExtension) return window.location.pathname
  return window.location.hash.slice(1) || '/'
}

export function readRoute(path = getRoutePath()): AppRoute {
  if (path === '/' || path === '/library') return { name: 'library' }

  const match = path.match(/^\/reader\/([^/]+)\/?$/)
  if (!match) return { name: 'not-found' }

  try {
    return { name: 'reader', bookId: decodeURIComponent(match[1]) }
  } catch {
    return { name: 'not-found' }
  }
}

export function navigate(
  path: string,
  options: { replace?: boolean } = {},
): void {
  const url = isExtension ? `#${path}` : path
  const method = options.replace ? 'replaceState' : 'pushState'

  window.history[method](null, '', url)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

export function subscribeRoute(callback: (route: AppRoute) => void): () => void {
  const update = () => callback(readRoute())

  window.addEventListener('popstate', update)
  window.addEventListener('hashchange', update)
  window.addEventListener(NAVIGATE_EVENT, update)
  update()

  return () => {
    window.removeEventListener('popstate', update)
    window.removeEventListener('hashchange', update)
    window.removeEventListener(NAVIGATE_EVENT, update)
  }
}
