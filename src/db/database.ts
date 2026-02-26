import Dexie, { type Table } from 'dexie';
import type { BookRecord } from '@/types/book';
import type { BookmarkRecord } from '@/types/bookmark';

class RebookDatabase extends Dexie {
  books!: Table<BookRecord, string>;
  bookmarks!: Table<BookmarkRecord, string>;

  constructor() {
    super('rebook-db');

    this.version(1).stores({
      books: 'id, title, author, addedAt, lastReadAt',
      bookmarks: 'id, bookId, createdAt',
    });
  }
}

export const db = new RebookDatabase();
