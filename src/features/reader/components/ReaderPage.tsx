import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useReader } from '../hooks/useReader';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReaderStore } from '@/stores/readerStore';
import { BookRenderer } from './BookRenderer';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderFooter } from './ReaderFooter';
import { TableOfContents } from './TableOfContents';
import { SettingsPanel } from './SettingsPanel';

export function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { bookUrl, book, error, saveProgress } = useReader(bookId);
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks(bookId);
  const { currentLocation, currentChapter, isLoading } = useReaderStore();

  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleToggleBookmark = useCallback(() => {
    if (!currentLocation) return;

    const existing = bookmarks.find((b) => b.cfi === currentLocation);
    if (existing) {
      removeBookmark(existing.id);
    } else {
      addBookmark(currentLocation, currentChapter || 'Bookmark');
    }
  }, [currentLocation, currentChapter, bookmarks, addBookmark, removeBookmark]);

  const handleNavigate = useCallback(
    (href: string) => {
      const store = useReaderStore.getState();
      store.setLocation(href);
    },
    [],
  );

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The book could not be loaded
          </p>
        </div>
        <button
          onClick={() => navigate('/library')}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (isLoading || !bookUrl || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
          <span className="text-sm text-muted-foreground">Loading book...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <ReaderToolbar
        title={book.title}
        onToggleToc={() => setTocOpen(true)}
        onToggleSettings={() => setSettingsOpen(true)}
        onToggleBookmark={handleToggleBookmark}
        isBookmarked={isBookmarked(currentLocation)}
      />

      <main className="relative min-h-0 flex-1">
        <BookRenderer
          url={bookUrl}
          initialLocation={book.lastLocation ?? null}
          onProgressChange={saveProgress}
        />
      </main>

      <ReaderFooter />

      <TableOfContents
        open={tocOpen}
        onOpenChange={setTocOpen}
        onNavigate={handleNavigate}
        bookmarks={bookmarks}
        onRemoveBookmark={removeBookmark}
      />

      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
