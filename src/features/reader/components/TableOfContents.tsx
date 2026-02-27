import { useState } from 'react';
import { BookmarkIcon, List, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useReaderStore } from '@/stores/readerStore';
import type { BookmarkRecord } from '@/types/bookmark';

interface TableOfContentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (href: string) => void;
  bookmarks: BookmarkRecord[];
  onRemoveBookmark: (id: string) => void;
}

type Tab = 'toc' | 'bookmarks';

export function TableOfContents({
  open,
  onOpenChange,
  onNavigate,
  bookmarks,
  onRemoveBookmark,
}: TableOfContentsProps) {
  const { toc } = useReaderStore();
  const [activeTab, setActiveTab] = useState<Tab>('toc');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[320px] border-r-0 p-0 shadow-2xl">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
            <button
              onClick={() => setActiveTab('toc')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === 'toc'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Contents
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === 'bookmarks'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookmarkIcon className="h-3.5 w-3.5" />
              Bookmarks
              {bookmarks.length > 0 && (
                <span className="ml-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-foreground/10 px-1 text-[10px] font-semibold">
                  {bookmarks.length}
                </span>
              )}
            </button>
          </div>
        </SheetHeader>

        <div className="mt-3 overflow-y-auto px-3 pb-4" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {activeTab === 'toc' ? (
            <nav className="space-y-0.5">
              {toc.map((item) => (
                <button
                  key={`${item.href}-${item.label}`}
                  onClick={() => {
                    onNavigate(item.href);
                    onOpenChange(false);
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/70"
                >
                  {item.label.trim()}
                </button>
              ))}
              {toc.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No table of contents
                </p>
              )}
            </nav>
          ) : (
            <div className="space-y-0.5">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="group flex items-start gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/70"
                >
                  <button
                    onClick={() => {
                      onNavigate(bookmark.cfi);
                      onOpenChange(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium leading-snug">
                      {bookmark.chapterName || 'Bookmark'}
                    </p>
                    {bookmark.excerpt && (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {bookmark.excerpt}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground/60">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bookmark.id)}
                    className="mt-0.5 shrink-0 rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
              {bookmarks.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No bookmarks yet
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
