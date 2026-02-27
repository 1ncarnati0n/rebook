import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { bookRepository } from '@/db/bookRepository';
import { arrayBufferToUrl } from '@/lib/storage';
import type { BookRecord } from '@/types/book';

export function useReader(bookId: string | undefined) {
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [book, setBook] = useState<BookRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setLocation, setIsLoading, reset } = useReaderStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgressRef = useRef<{
    location: string;
    progress: number;
  } | null>(null);

  const flushPendingProgress = useCallback((targetBookId: string) => {
    const pending = pendingProgressRef.current;
    if (!pending) return;

    pendingProgressRef.current = null;
    void bookRepository.updateProgress(
      targetBookId,
      pending.location,
      pending.progress,
    );
  }, []);

  useEffect(() => {
    reset();
    setError(null);
    setBook(null);
    setBookUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });

    if (!bookId) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    let blobUrl: string | null = null;

    const loadBook = async () => {
      try {
        const record = await bookRepository.getBook(bookId);
        if (isCancelled) return;

        if (!record) {
          setError('Book not found');
          return;
        }

        setBook(record);
        const url = arrayBufferToUrl(record.fileData);
        blobUrl = url;

        if (isCancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        setBookUrl(url);
        if (record.lastLocation) {
          setLocation(record.lastLocation);
        }
      } catch {
        if (!isCancelled) {
          setError('Failed to load book');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadBook();

    return () => {
      isCancelled = true;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      flushPendingProgress(bookId);

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [bookId, flushPendingProgress, reset, setLocation, setIsLoading]);

  const saveProgress = useCallback(
    (location: string, progress: number) => {
      if (!bookId) return;

      pendingProgressRef.current = { location, progress };

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        flushPendingProgress(bookId);
      }, 1000);
    },
    [bookId, flushPendingProgress],
  );

  return { bookUrl, book, error, saveProgress };
}
