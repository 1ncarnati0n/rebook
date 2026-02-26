import { db } from './database';
import type { BookMeta, BookRecord } from '@/types/book';

export const bookRepository = {
  async addBook(book: BookRecord): Promise<void> {
    await db.books.put(book);
  },

  async getAllMeta(): Promise<BookMeta[]> {
    const books = await db.books.orderBy('lastReadAt').reverse().toArray();
    return books.map(({ fileData: _f, coverData: _c, ...meta }) => meta);
  },

  async getBook(id: string): Promise<BookRecord | undefined> {
    return db.books.get(id);
  },

  async getCover(id: string): Promise<Blob | undefined> {
    const book = await db.books.get(id);
    return book?.coverData;
  },

  async updateProgress(
    id: string,
    location: string,
    progress: number,
  ): Promise<void> {
    await db.books.update(id, {
      lastLocation: location,
      progress,
      lastReadAt: Date.now(),
    });
  },

  async deleteBook(id: string): Promise<void> {
    await db.transaction('rw', db.books, db.bookmarks, async () => {
      await db.books.delete(id);
      await db.bookmarks.where('bookId').equals(id).delete();
    });
  },
};
