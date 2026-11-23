import { useMemo, useState } from 'react';
import {
  LANGUAGE_GROUP_ORDER,
  LANGUAGE_PRESETS,
  MAX_LANGUAGES,
  languageByCode,
  languagesMatching,
  parseLanguageSpec,
  sameLanguageSet,
  toggleLanguage,
} from '../lib/languages';
import type { Settings } from '../lib/storage';
import { Hint } from './Hint';

export function LanguagePicker({
  settings,
  onSettings,
}: {
  settings: Settings;
  onSettings: (patch: Partial<Settings>) => void;
}) {
  const [query, setQuery] = useState('');
  const [limitNote, setLimitNote] = useState('');
  const selected = parseLanguageSpec(settings.language);
  const matches = useMemo(() => languagesMatching(query), [query]);
  const groups = useMemo(() => {
    return LANGUAGE_GROUP_ORDER
      .map((group) => ({ group, languages: matches.filter((language) => language.group === group) }))
      .filter((entry) => entry.languages.length > 0);
  }, [matches]);

  function apply(spec: string) {
    setLimitNote('');
    onSettings({ language: spec });
  }

  return (
    <div className="language-picker">
      <div className="picker-head">
        <span id="language-label">
          Languages
          <Hint text="Tick more than one language for a mixed page, for example Urdu and English. Each language downloads the first time you use it and stays in this browser. The image is not part of that download. Three languages is the limit." />
        </span>
        <div className="presets" role="group" aria-label="Language presets">
          {LANGUAGE_PRESETS.map((preset) => (
            <button
              key={preset.spec}
              type="button"
              className={sameLanguageSet(settings.language, preset.spec) ? 'btn btn-primary' : 'btn btn-ghost'}
              aria-pressed={sameLanguageSet(settings.language, preset.spec)}
              onClick={() => apply(preset.spec)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="chips" aria-label="Selected languages">
        {selected.map((code) => {
          const language = languageByCode(code);
          return (
            <li key={code}>
              <span>{language.label}</span>
              <button
                type="button"
                aria-label={`Remove ${language.label}`}
                onClick={() => apply(toggleLanguage(settings.language, code).spec)}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <label className="field">
        <span className="sr-only">Search languages</span>
        <input
          type="search"
          name="language-search"
          placeholder="Search languages, for example Sindhi or fas"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="language-list" role="group" aria-labelledby="language-label">
        {groups.length === 0 && <p className="fine">No language matches that search.</p>}
        {groups.map((entry) => (
          <section key={entry.group}>
            <h3>{entry.group}</h3>
            <div className="lang-options">
              {entry.languages.map((language) => {
                const checked = selected.includes(language.code);
                return (
                  <label key={language.code} className="check">
                    <input
                      type="checkbox"
                      name="language"
                      value={language.code}
                      checked={checked}
                      onChange={() => {
                        const next = toggleLanguage(settings.language, language.code);
                        if (next.limited) {
                          setLimitNote(`You can combine up to ${MAX_LANGUAGES} languages. Remove one to add ${language.label}.`);
                          return;
                        }
                        setLimitNote('');
                        onSettings({ language: next.spec });
                      }}
                    />
                    {language.label}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="fine">
        Tesseract reads this as <code>{settings.language}</code>.
        {selected.length > 1 ? ' Mixed script is kept: right-to-left words stay in their own direction.' : ''}
      </p>
      {limitNote && <p className="error" role="status">{limitNote}</p>}
    </div>
  );
}
