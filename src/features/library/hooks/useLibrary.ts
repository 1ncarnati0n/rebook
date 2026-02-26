import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '@/stores/libraryStore';
import { bookRepository } from '@/db/bookRepository';
import { extractEpubMetadata } from '@/lib/epub-utils';
import { fileToArrayBuffer } from '@/lib/storage';
import type { BookRecord } from '@/types/book';

export function useLibrary() {
  const { books, sortBy, isUploading, setBooks, addBook, removeBook, setSortBy, setIsUploading } =
    useLibraryStore();
  const navigate = useNavigate();

  useEffect(() => {
    bookRepository.getAllMeta().then(setBooks);
  }, [setBooks]);

  const uploadBook = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.epub')) return;

      setIsUploading(true);
      try {
        const arrayBuffer = await fileToArrayBuffer(file);
        const metadata = await extractEpubMetadata(arrayBuffer);
        const id = crypto.randomUUID();
        const now = Date.now();

        const bookRecord: BookRecord = {
          id,
          title: metadata.title,
          author: metadata.author,
          addedAt: now,
          lastReadAt: now,
          progress: 0,
          fileSize: file.size,
          fileData: arrayBuffer,
          coverData: metadata.coverData,
        };

        await bookRepository.addBook(bookRecord);
        addBook({
          id,
          title: metadata.title,
          author: metadata.author,
          addedAt: now,
          lastReadAt: now,
          progress: 0,
          fileSize: file.size,
        });

        navigate(`/reader/${id}`);
      } finally {
        setIsUploading(false);
      }
    },
    [setIsUploading, addBook, navigate],
  );

  const deleteBook = useCallback(
    async (id: string) => {
      await bookRepository.deleteBook(id);
      removeBook(id);
    },
    [removeBook],
  );

  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return b[sortBy] - a[sortBy];
  });

  return {
    books: sortedBooks,
    sortBy,
    isUploading,
    uploadBook,
    deleteBook,
    setSortBy,
  };
}
