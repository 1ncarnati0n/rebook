import { useCallback, useEffect, useState } from 'react';
import { bookmarkRepository } from '@/db/bookmarkRepository';
import type { BookmarkRecord } from '@/types/bookmark';

export function useBookmarks(bookId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);

  useEffect(() => {
    if (!bookId) return;
    bookmarkRepository.getByBookId(bookId).then(setBookmarks);
  }, [bookId]);

  const addBookmark = useCallback(
    async (cfi: string, chapterName: string, excerpt?: string) => {
      if (!bookId) return;

      const existing = await bookmarkRepository.findByCfi(bookId, cfi);
      if (existing) return;

      const bookmark: BookmarkRecord = {
        id: crypto.randomUUID(),
        bookId,
        cfi,
        chapterName,
        excerpt,
        createdAt: Date.now(),
      };

      await bookmarkRepository.add(bookmark);
      setBookmarks((prev) => [bookmark, ...prev]);
    },
    [bookId],
  );

  const removeBookmark = useCallback(async (id: string) => {
    await bookmarkRepository.remove(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const isBookmarked = useCallback(
    (cfi: string | null) => {
      if (!cfi) return false;
      return bookmarks.some((b) => b.cfi === cfi);
    },
    [bookmarks],
  );

  return { bookmarks, addBookmark, removeBookmark, isBookmarked };
}
