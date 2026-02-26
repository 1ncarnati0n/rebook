import { BookOpen, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLibrary } from '../hooks/useLibrary';
import { BookGrid } from './BookGrid';
import { EmptyLibrary } from './EmptyLibrary';
import { FileUploadZone } from './FileUploadZone';

const SORT_LABELS = {
  lastReadAt: 'Last Read',
  addedAt: 'Date Added',
  title: 'Title',
} as const;

export function LibraryPage() {
  const { books, sortBy, isUploading, uploadBook, deleteBook, setSortBy } =
    useLibrary();

  if (books.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
            <BookOpen className="h-4.5 w-4.5 text-background" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Rebook</h1>
        </header>
        <EmptyLibrary onUpload={uploadBook} isUploading={isUploading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
              <BookOpen className="h-4.5 w-4.5 text-background" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Rebook</h1>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {SORT_LABELS[sortBy]}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => setSortBy('lastReadAt')}>
                  Last Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('addedAt')}>
                  Date Added
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('title')}>
                  Title
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <FileUploadZone
              onUpload={uploadBook}
              isUploading={isUploading}
              compact
            />
          </div>
        </div>
      </header>

      <main className="px-6 pb-8">
        <BookGrid books={books} onDelete={deleteBook} />
      </main>
    </div>
  );
}
