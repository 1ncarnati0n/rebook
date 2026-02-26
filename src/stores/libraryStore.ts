import { create } from 'zustand';
import type { BookMeta } from '@/types/book';

type SortBy = 'lastReadAt' | 'addedAt' | 'title';

interface LibraryState {
  books: BookMeta[];
  sortBy: SortBy;
  isUploading: boolean;

  setBooks: (books: BookMeta[]) => void;
  addBook: (book: BookMeta) => void;
  removeBook: (id: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  setIsUploading: (uploading: boolean) => void;
}

export const useLibraryStore = create<LibraryState>()((set) => ({
  books: [],
  sortBy: 'lastReadAt',
  isUploading: false,

  setBooks: (books) => set({ books }),
  addBook: (book) =>
    set((state) => ({ books: [book, ...state.books] })),
  removeBook: (id) =>
    set((state) => ({ books: state.books.filter((b) => b.id !== id) })),
  setSortBy: (sortBy) => set({ sortBy }),
  setIsUploading: (isUploading) => set({ isUploading }),
}));
