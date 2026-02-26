import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { bookRepository } from '@/db/bookRepository';
import { arrayBufferToUrl } from '@/lib/epub-utils';
import type { BookRecord } from '@/types/book';

export function useReader(bookId: string | undefined) {
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [book, setBook] = useState<BookRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setLocation, setIsLoading, reset } = useReaderStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!bookId) return;

    let blobUrl: string | null = null;

    reset();

    bookRepository.getBook(bookId).then((record) => {
      if (!record) {
        setError('Book not found');
        setIsLoading(false);
        return;
      }
      setBook(record);
      const url = arrayBufferToUrl(record.fileData);
      blobUrl = url;
      setBookUrl(url);

      if (record.lastLocation) {
        setLocation(record.lastLocation);
      }
      setIsLoading(false);
    });

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [bookId, reset, setLocation, setIsLoading]);

  const saveProgress = useCallback(
    (location: string, progress: number) => {
      if (!bookId) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        bookRepository.updateProgress(bookId, location, progress);
      }, 1000);
    },
    [bookId],
  );

  return { bookUrl, book, error, saveProgress };
}
