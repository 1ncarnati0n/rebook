export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function isEpubFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith('.epub') || file.type === 'application/epub+zip';
}

export function arrayBufferToUrl(buffer: ArrayBuffer): string {
  const blob = new Blob([buffer], { type: 'application/epub+zip' });
  return URL.createObjectURL(blob);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
