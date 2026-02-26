import { create } from 'zustand';
import type { NavItem } from 'epubjs';

interface ReaderState {
  currentLocation: string | null;
  toc: NavItem[];
  currentChapter: string;
  progress: number;
  isLoading: boolean;

  setLocation: (location: string) => void;
  setToc: (toc: NavItem[]) => void;
  setCurrentChapter: (chapter: string) => void;
  setProgress: (progress: number) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useReaderStore = create<ReaderState>()((set) => ({
  currentLocation: null,
  toc: [],
  currentChapter: '',
  progress: 0,
  isLoading: true,

  setLocation: (currentLocation) => set({ currentLocation }),
  setToc: (toc) => set({ toc }),
  setCurrentChapter: (currentChapter) => set({ currentChapter }),
  setProgress: (progress) => set({ progress }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      currentLocation: null,
      toc: [],
      currentChapter: '',
      progress: 0,
      isLoading: true,
    }),
}));
