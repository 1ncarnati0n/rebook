import { useCallback, useEffect, useRef, useState } from 'react';
import { BookmarkIcon, Check, ChevronDown, ChevronRight, List, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReaderStore } from '@/stores/readerStore';
import type { BookmarkRecord } from '@/types/bookmark';
import type { NavItem } from 'epubjs';

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

interface TableOfContentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (href: string) => void;
  bookmarks: BookmarkRecord[];
  onUpdateBookmark: (id: string, chapterName: string) => void;
  onRemoveBookmark: (id: string) => void;
}

type Tab = 'toc' | 'bookmarks';

function TocItem({
  item,
  depth,
  onNavigate,
}: {
  item: NavItem;
  depth: number;
  onNavigate: (href: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.subitems && item.subitems.length > 0;

  return (
    <div>
      <button
        onClick={() => onNavigate(item.href)}
        className="group flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/70"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span
            role="button"
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span
          className={`truncate leading-snug ${
            depth === 0 ? 'font-medium' : 'text-muted-foreground'
          }`}
        >
          {item.label.trim()}
        </span>
      </button>
      {hasChildren && expanded && (
        <div>
          {item.subitems!.map((child) => (
            <TocItem
              key={`${child.href}-${child.label}`}
              item={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookmarkItem({
  bookmark,
  onNavigate,
  onUpdate,
  onRemove,
}: {
  bookmark: BookmarkRecord;
  onNavigate: (href: string) => void;
  onUpdate: (id: string, chapterName: string) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bookmark.chapterName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== bookmark.chapterName) {
      onUpdate(bookmark.id, trimmed);
    } else {
      setDraft(bookmark.chapterName);
    }
    setEditing(false);
  };

  return (
    <div className="group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/70">
      <button
        onClick={() => onNavigate(bookmark.cfi)}
        className="flex-1 text-left"
      >
        {editing ? (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') {
                  setDraft(bookmark.chapterName);
                  setEditing(false);
                }
              }}
              onBlur={save}
              className="w-full rounded-md border bg-background px-1.5 py-0.5 text-sm font-medium leading-snug outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ) : (
          <p className="text-sm font-medium leading-snug">
            {bookmark.chapterName || 'Bookmark'}
          </p>
        )}
        {bookmark.excerpt && !editing && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {bookmark.excerpt}
          </p>
        )}
        {!editing && (
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            {new Date(bookmark.createdAt).toLocaleDateString()}
          </p>
        )}
      </button>
      <div className="mt-0.5 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {editing ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              save();
            }}
            className="rounded-lg p-1.5 hover:bg-muted"
          >
            <Check className="h-3 w-3 text-primary" />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="rounded-lg p-1.5 hover:bg-muted"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={() => onRemove(bookmark.id)}
          className="rounded-lg p-1.5 hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </button>
      </div>
    </div>
  );
}

export function TableOfContents({
  open,
  onOpenChange,
  onNavigate,
  bookmarks,
  onUpdateBookmark,
  onRemoveBookmark,
}: TableOfContentsProps) {
  const { toc } = useReaderStore();
  const [activeTab, setActiveTab] = useState<Tab>('toc');
  const [width, setWidth] = useState(280);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (moveEvent.clientX - startX)));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width]);

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r bg-background ${
        open ? '' : 'w-0 overflow-hidden'
      }`}
      style={open ? { width } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
          <button
            onClick={() => setActiveTab('toc')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'toc'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-3 w-3" />
            Contents
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'bookmarks'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookmarkIcon className="h-3 w-3" />
            Bookmarks
            {bookmarks.length > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/10 px-1 text-[10px] font-semibold">
                {bookmarks.length}
              </span>
            )}
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-1">
        {activeTab === 'toc' ? (
          <nav className="space-y-px">
            {toc.map((item) => (
              <TocItem
                key={`${item.href}-${item.label}`}
                item={item}
                depth={0}
                onNavigate={onNavigate}
              />
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
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onNavigate={onNavigate}
                onUpdate={onUpdateBookmark}
                onRemove={onRemoveBookmark}
              />
            ))}
            {bookmarks.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No bookmarks yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 z-10 flex h-full w-2 translate-x-1/2 cursor-col-resize items-center justify-center opacity-0 transition-opacity hover:opacity-100"
      >
        <div className="h-8 w-1 rounded-full bg-muted-foreground/30" />
      </div>
    </aside>
  );
}
