import { useEffect, useState } from 'react';
import { localeCopy, type SupportedLocale } from '@/config/site';

type ThemeName = 'light' | 'dark';

function getCurrentTheme(): ThemeName {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

interface Props {
  locale?: SupportedLocale;
}

export default function ThemeToggle({ locale = 'en' }: Props) {
  const [theme, setTheme] = useState<ThemeName>('dark');
  const chromeCopy = localeCopy[locale].chrome;

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  const nextTheme: ThemeName = theme === 'dark' ? 'light' : 'dark';

  function toggleTheme() {
    const resolved = nextTheme;
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('adms-theme', resolved);
    setTheme(resolved);
  }

  const fullLabel = theme === 'dark' ? chromeCopy.themeDark : chromeCopy.themeLight;
  const compactLabel = theme === 'dark' ? chromeCopy.themeDarkCompact : chromeCopy.themeLightCompact;

  return (
    <button
      type="button"
      className="theme-toggle"
      data-theme-toggle
      onClick={toggleTheme}
      aria-label={nextTheme === 'dark' ? chromeCopy.switchToDark : chromeCopy.switchToLight}
    >
      <span className="theme-toggle-label theme-toggle-label-full">{fullLabel}</span>
      <span className="theme-toggle-label theme-toggle-label-compact">{compactLabel}</span>
      <span className="theme-toggle-glyph" aria-hidden="true">
        {theme === 'dark' ? '◐' : '◑'}
      </span>
    </button>
  );
}
