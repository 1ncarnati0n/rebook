interface EpubMetadata {
  title: string;
  author: string;
  coverData?: Blob;
}

export async function extractEpubMetadata(
  arrayBuffer: ArrayBuffer,
): Promise<EpubMetadata> {
  const { default: ePub } = await import('epubjs');
  const book = ePub(arrayBuffer);
  await book.ready;

  const metadata = await book.loaded.metadata;
  const title = metadata.title || 'Untitled';
  const author = metadata.creator || 'Unknown Author';

  let coverData: Blob | undefined;
  try {
    const coverUrl = await book.coverUrl();
    if (coverUrl) {
      const response = await fetch(coverUrl);
      coverData = await response.blob();
    }
  } catch {
    // Cover extraction can fail silently
  }

  book.destroy();

  return { title, author, coverData };
}
