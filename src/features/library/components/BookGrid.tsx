import { BookCard } from './BookCard';
import type { BookMeta } from '@/types/book';

interface BookGridProps {
  books: BookMeta[];
  onDelete: (id: string) => void;
}

export function BookGrid({ books, onDelete }: BookGridProps) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onDelete={onDelete} />
      ))}
    </div>
  );
}
