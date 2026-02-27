import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReaderSettings, ReaderTheme, ViewMode } from '@/types/settings';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  theme: 'light',
  lineHeight: 1.6,
  fontFamily: 'serif',
  viewMode: 'paginated',
};

function normalizeTheme(theme: unknown): ReaderTheme {
  return theme === 'sepia' ? 'sepia' : 'light';
}

interface SettingsState extends ReaderSettings {
  setFontSize: (size: number) => void;
  setTheme: (theme: ReaderTheme) => void;
  setLineHeight: (height: number) => void;
  setFontFamily: (family: 'serif' | 'sans-serif') => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setFontSize: (fontSize) => set({ fontSize }),
      setTheme: (theme) => set({ theme: normalizeTheme(theme) }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'rebook-settings',
      version: 4,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<
          ReaderSettings & { theme?: ReaderTheme | 'dark' }
        >;

        return {
          ...DEFAULT_SETTINGS,
          ...state,
          theme: normalizeTheme(state.theme),
        };
      },
      partialize: (state) => ({
        fontSize: state.fontSize,
        theme: state.theme,
        lineHeight: state.lineHeight,
        fontFamily: state.fontFamily,
        viewMode: state.viewMode,
      }),
    },
  ),
);
