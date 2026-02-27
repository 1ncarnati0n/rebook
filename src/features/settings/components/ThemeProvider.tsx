import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.toggle('reader-sepia', theme === 'sepia');

    return () => {
      root.classList.remove('reader-sepia');
    };
  }, [theme]);

  return <>{children}</>;
}
