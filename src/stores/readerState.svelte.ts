import type { NavItem } from 'epubjs'

class ReaderState {
  currentLocation = $state<string | null>(null)
  currentTocHref = $state<string | null>(null)
  toc = $state<NavItem[]>([])
  currentChapter = $state('')
  progress = $state(0)
  isLoading = $state(true)

  reset(): void {
    this.currentLocation = null
    this.currentTocHref = null
    this.toc = []
    this.currentChapter = ''
    this.progress = 0
    this.isLoading = true
  }
}

export const readerState = new ReaderState()
