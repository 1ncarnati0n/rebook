import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, BookOpen } from 'lucide-react';
import { bookRepository } from '@/db/bookRepository';
import { formatFileSize } from '@/lib/storage';
import type { BookMeta } from '@/types/book';

interface BookCardProps {
  book: BookMeta;
  onDelete: (id: string) => void;
}

export function BookCard({ book, onDelete }: BookCardProps) {
  const navigate = useNavigate();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    bookRepository.getCover(book.id).then((blob) => {
      if (blob) setCoverUrl(URL.createObjectURL(blob));
    });
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const rounded = Math.round(book.progress);

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/reader/${book.id}`)}
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/5">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/5">
            <BookOpen className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}

        {/* Progress Overlay */}
        {rounded > 0 && (
          <div className="absolute inset-x-0 bottom-0">
            <div className="h-1 bg-black/10">
              <div
                className="h-full bg-white/80 transition-all duration-500"
                style={{ width: `${rounded}%` }}
              />
            </div>
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(book.id);
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Meta */}
      <div className="mt-2.5 px-0.5">
        <h3 className="truncate text-sm font-semibold leading-snug">
          {book.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {book.author}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {rounded > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground/70">
              {rounded}%
            </span>
          )}
          <span className="text-[11px] text-muted-foreground/50">
            {formatFileSize(book.fileSize)}
          </span>
        </div>
      </div>
    </div>
  );
}
