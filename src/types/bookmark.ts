export interface BookmarkRecord {
  id: string;
  bookId: string;
  cfi: string;
  chapterName: string;
  excerpt?: string;
  createdAt: number;
}
