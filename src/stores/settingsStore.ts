import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReaderSettings, ReaderTheme, ViewMode } from '@/types/settings';

interface SettingsState extends ReaderSettings {
  setFontSize: (size: number) => void;
  setTheme: (theme: ReaderTheme) => void;
  setLineHeight: (height: number) => void;
  setFontFamily: (family: 'serif' | 'sans-serif') => void;
  setViewMode: (mode: ViewMode) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 16,
      theme: 'light',
      lineHeight: 1.6,
      fontFamily: 'serif',
      viewMode: 'paginated',
      appDarkMode: false,

      setFontSize: (fontSize) => set({ fontSize }),
      setTheme: (theme) => set({ theme }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setViewMode: (viewMode) => set({ viewMode }),
      toggleDarkMode: () =>
        set((state) => ({ appDarkMode: !state.appDarkMode })),
    }),
    { name: 'rebook-settings' },
  ),
);
