import { useEffect, useState } from 'react';

type ThemeName = 'light' | 'dark';

function getCurrentTheme(): ThemeName {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>('dark');

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

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
      <span aria-hidden="true">{theme === 'dark' ? '◐' : '◑'}</span>
    </button>
  );
}
