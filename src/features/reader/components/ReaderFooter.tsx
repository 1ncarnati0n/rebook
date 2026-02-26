import { useReaderStore } from '@/stores/readerStore';

export function ReaderFooter() {
  const { currentChapter, progress } = useReaderStore();
  const rounded = Math.round(progress);

  return (
    <footer className="bg-background/80 px-4 py-2 backdrop-blur-xl">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="max-w-[200px] truncate sm:max-w-[400px]">
          {currentChapter}
        </span>
        <span className="tabular-nums font-medium">{rounded}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-foreground/20 transition-all duration-500 ease-out"
          style={{ width: `${rounded}%` }}
        />
      </div>
    </footer>
  );
}
