import { db } from './database';
import type { BookmarkRecord } from '@/types/bookmark';

export const bookmarkRepository = {
  async getByBookId(bookId: string): Promise<BookmarkRecord[]> {
    return db.bookmarks
      .where('bookId')
      .equals(bookId)
      .reverse()
      .sortBy('createdAt');
  },

  async add(bookmark: BookmarkRecord): Promise<void> {
    await db.bookmarks.put(bookmark);
  },

  async remove(id: string): Promise<void> {
    await db.bookmarks.delete(id);
  },

  async findByCfi(
    bookId: string,
    cfi: string,
  ): Promise<BookmarkRecord | undefined> {
    return db.bookmarks
      .where('bookId')
      .equals(bookId)
      .filter((b) => b.cfi === cfi)
      .first();
  },
};
