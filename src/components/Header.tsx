import type { ThemeMode } from '../lib/storage';

const MODES: Array<{ id: ThemeMode; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

export function Header({ theme, onTheme }: { theme: ThemeMode; onTheme: (mode: ThemeMode) => void }) {
  return (
    <header className="topbar">
      <a className="skip" href="#output">Skip to extracted text</a>
      <div className="brand">
        <a href="https://github.com/devistic-asim" target="_blank" rel="noopener noreferrer">
          <img src={`${import.meta.env.BASE_URL}devistic-logo.jpg`} alt="Devistic" />
        </a>
        <span>
          <span className="brand-name">Devistic OCR</span>
          <span className="brand-tag">Image to text, on this device</span>
        </span>
      </div>
      <div className="theme" role="radiogroup" aria-label="Color theme">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={theme === mode.id}
            className={theme === mode.id ? 'is-on' : undefined}
            onClick={() => onTheme(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </header>
  );
}
