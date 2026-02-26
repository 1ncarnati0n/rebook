import { ArrowLeft, List, Settings, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ReaderToolbarProps {
  title: string;
  onToggleToc: () => void;
  onToggleSettings: () => void;
  onToggleBookmark: () => void;
  isBookmarked: boolean;
}

export function ReaderToolbar({
  title,
  onToggleToc,
  onToggleSettings,
  onToggleBookmark,
  isBookmarked,
}: ReaderToolbarProps) {
  const navigate = useNavigate();

  return (
    <header className="flex h-14 items-center justify-between bg-background/80 px-2 backdrop-blur-xl sm:px-4">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={() => navigate('/library')}
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Button>
        <div className="ml-1 flex flex-col">
          <h1 className="max-w-[180px] truncate text-sm font-semibold leading-tight sm:max-w-[400px]">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onToggleBookmark}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-[18px] w-[18px] text-primary" />
          ) : (
            <Bookmark className="h-[18px] w-[18px]" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onToggleToc}
        >
          <List className="h-[18px] w-[18px]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onToggleSettings}
        >
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </header>
  );
}
