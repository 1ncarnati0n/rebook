export type ReaderTheme = 'light' | 'sepia';
export type ViewMode = 'paginated' | 'scrolled';

export interface ReaderSettings {
  fontSize: number; // 12-28
  theme: ReaderTheme;
  lineHeight: number; // 1.2-2.0
  fontFamily: 'serif' | 'sans-serif';
  viewMode: ViewMode;
}
