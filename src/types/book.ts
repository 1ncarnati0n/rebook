export interface BookMeta {
  id: string;
  title: string;
  author: string;
  addedAt: number;
  lastReadAt: number;
  lastLocation?: string; // EPUB CFI
  progress: number; // 0-100
  fileSize: number;
}

export interface BookRecord extends BookMeta {
  fileData: ArrayBuffer;
  coverData?: Blob;
}
