import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Upload, Loader2, Plus } from 'lucide-react';
import { isEpubFile } from '@/lib/storage';

interface FileUploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  compact?: boolean;
}

export function FileUploadZone({
  onUpload,
  isUploading,
  compact,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && isEpubFile(file)) {
        onUpload(file);
      }
    },
    [onUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
        e.target.value = '';
      }
    },
    [onUpload],
  );

  if (compact) {
    return (
      <>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".epub"
          onChange={handleFileSelect}
          className="hidden"
        />
      </>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-14 transition-all ${
        isDragOver
          ? 'border-foreground/30 bg-foreground/5'
          : 'border-muted-foreground/15 hover:border-foreground/20 hover:bg-muted/30'
      }`}
    >
      {isUploading ? (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-muted-foreground/50" />
      ) : (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
          <Upload className="h-5 w-5 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-sm font-medium">
        {isUploading ? 'Processing...' : 'Drop EPUB file here'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        or click to browse
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".epub"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
