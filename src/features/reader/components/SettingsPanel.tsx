import { Sun, Moon, BookOpen, ScrollText, Minus, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ReaderTheme, ViewMode } from '@/types/settings';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const THEMES: { value: ReaderTheme; label: string; bg: string; border: string }[] = [
  { value: 'light', label: 'Light', bg: '#ffffff', border: '#e5e5e5' },
  { value: 'sepia', label: 'Sepia', bg: '#f4ecd8', border: '#d4c4a8' },
  { value: 'dark', label: 'Dark', bg: '#1c1c1e', border: '#3a3a3c' },
];

const VIEW_MODES: { value: ViewMode; label: string; icon: typeof BookOpen }[] = [
  { value: 'paginated', label: 'Page', icon: BookOpen },
  { value: 'scrolled', label: 'Scroll', icon: ScrollText },
];

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const {
    fontSize,
    theme,
    lineHeight,
    fontFamily,
    viewMode,
    appDarkMode,
    setFontSize,
    setTheme,
    setLineHeight,
    setFontFamily,
    setViewMode,
    toggleDarkMode,
  } = useSettingsStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] overflow-y-auto border-l-0 p-0 shadow-2xl">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="pr-8 text-base font-semibold tracking-tight">
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-7 px-5 pb-8">
          {/* View Mode */}
          <section>
            <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              View Mode
            </span>
            <div className="grid grid-cols-2 gap-2">
              {VIEW_MODES.map((m) => {
                const Icon = m.icon;
                const isActive = viewMode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setViewMode(m.value)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Font Size */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Font Size
              </span>
              <span className="tabular-nums text-sm font-medium">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={12}
                max={28}
                step={1}
                className="flex-1"
              />
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 1))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* Line Height */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Line Height
              </span>
              <span className="tabular-nums text-sm font-medium">{lineHeight.toFixed(1)}</span>
            </div>
            <Slider
              value={[lineHeight]}
              onValueChange={([v]) => setLineHeight(v)}
              min={1.2}
              max={2.0}
              step={0.1}
            />
          </section>

          {/* Font Family */}
          <section>
            <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Typeface
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFontFamily('serif')}
                className={`rounded-xl px-4 py-3 text-sm transition-all ${
                  fontFamily === 'serif'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="block font-serif text-lg leading-none">Aa</span>
                <span className="mt-1 block text-xs">Serif</span>
              </button>
              <button
                onClick={() => setFontFamily('sans-serif')}
                className={`rounded-xl px-4 py-3 text-sm transition-all ${
                  fontFamily === 'sans-serif'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="block text-lg font-light leading-none">Aa</span>
                <span className="mt-1 block text-xs">Sans</span>
              </button>
            </div>
          </section>

          {/* Reader Theme */}
          <section>
            <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reader Theme
            </span>
            <div className="flex gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-xl p-3 transition-all ${
                    theme === t.value
                      ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div
                    className="h-10 w-10 rounded-full shadow-inner"
                    style={{ backgroundColor: t.bg, border: `2px solid ${t.border}` }}
                  />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* App Dark Mode */}
          <section>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                {appDarkMode ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  appDarkMode ? 'bg-foreground' : 'bg-muted-foreground/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow-sm transition-transform ${
                    appDarkMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
