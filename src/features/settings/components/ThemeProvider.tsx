import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appDarkMode = useSettingsStore((s) => s.appDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', appDarkMode);
  }, [appDarkMode]);

  return <>{children}</>;
}
