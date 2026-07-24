import type { ReaderSettings, ReaderTheme, ViewMode } from '@/types/settings'

const STORAGE_KEY = 'rebook-settings'
const STORAGE_VERSION = 4

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  fontColor: null,
  theme: 'light',
  lineHeight: 1.6,
  fontFamily: 'serif',
  viewMode: 'paginated',
}

function normalizeTheme(theme: unknown): ReaderTheme {
  return theme === 'sepia' ? 'sepia' : 'light'
}

function normalizeFontColor(fontColor: unknown): string | null {
  return typeof fontColor === 'string' && /^#[0-9a-f]{6}$/i.test(fontColor)
    ? fontColor.toLowerCase()
    : null
}

function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS

    const persisted = JSON.parse(raw) as {
      state?: Partial<ReaderSettings & { theme: ReaderTheme | 'dark' }>
    }
    const state = persisted.state ?? {}

    return {
      ...DEFAULT_SETTINGS,
      ...state,
      fontColor: normalizeFontColor(state.fontColor),
      theme: normalizeTheme(state.theme),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

class SettingsState {
  fontSize = $state(DEFAULT_SETTINGS.fontSize)
  fontColor = $state<ReaderSettings['fontColor']>(DEFAULT_SETTINGS.fontColor)
  theme = $state<ReaderTheme>(DEFAULT_SETTINGS.theme)
  lineHeight = $state(DEFAULT_SETTINGS.lineHeight)
  fontFamily = $state<ReaderSettings['fontFamily']>(DEFAULT_SETTINGS.fontFamily)
  viewMode = $state<ViewMode>(DEFAULT_SETTINGS.viewMode)

  constructor() {
    Object.assign(this, loadSettings())
  }

  setFontSize(fontSize: number): void {
    this.fontSize = fontSize
    this.persist()
  }

  setFontColor(fontColor: ReaderSettings['fontColor']): void {
    this.fontColor = normalizeFontColor(fontColor)
    this.persist()
  }

  setTheme(theme: ReaderTheme): void {
    this.theme = normalizeTheme(theme)
    this.persist()
  }

  setLineHeight(lineHeight: number): void {
    this.lineHeight = lineHeight
    this.persist()
  }

  setFontFamily(fontFamily: ReaderSettings['fontFamily']): void {
    this.fontFamily = fontFamily
    this.persist()
  }

  setViewMode(viewMode: ViewMode): void {
    this.viewMode = viewMode
    this.persist()
  }

  private persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: {
            fontSize: this.fontSize,
            fontColor: this.fontColor,
            theme: this.theme,
            lineHeight: this.lineHeight,
            fontFamily: this.fontFamily,
            viewMode: this.viewMode,
          },
          version: STORAGE_VERSION,
        }),
      )
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }
}

export const settingsState = new SettingsState()
