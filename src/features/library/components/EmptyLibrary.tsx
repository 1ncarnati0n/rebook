import { BookOpen } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';

interface EmptyLibraryProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function EmptyLibrary({ onUpload, isUploading }: EmptyLibraryProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50">
        <BookOpen className="h-9 w-9 text-muted-foreground/40" />
      </div>
      <h2 className="mb-1.5 text-xl font-semibold tracking-tight">
        Your library is empty
      </h2>
      <p className="mb-10 text-sm text-muted-foreground">
        Drop an EPUB file to start reading
      </p>
      <div className="w-full max-w-sm">
        <FileUploadZone onUpload={onUpload} isUploading={isUploading} />
      </div>
    </div>
  );
}
