import { LANGUAGES } from '../lib/languages';
import type { Settings } from '../lib/storage';
import type { QueueItem } from '../types';
import { Hint } from './Hint';

export function Controls({
  settings,
  item,
  running,
  onSettings,
  onExtract,
  onRerun,
  onStop,
}: {
  settings: Settings;
  item: QueueItem | null;
  running: boolean;
  onSettings: (patch: Partial<Settings>) => void;
  onExtract: () => void;
  onRerun: () => void;
  onStop: () => void;
}) {
  const featured = LANGUAGES.filter((language) => language.featured);
  const rest = LANGUAGES.filter((language) => !language.featured);
  const progress = item?.status === 'running' ? item.progress : 0;
  const label = item?.status === 'running' ? item.progressLabel : 'Waiting';

  return (
    <section className="controls" aria-label="Recognition options">
      <label className="field">
        <span>
          Language
          <Hint text="English is ready to use. Other languages download the first time you pick them and stay cached in this browser. The image is not part of that download." />
        </span>
        <select
          id="language"
          name="language"
          value={settings.language}
          onChange={(event) => onSettings({ language: event.target.value })}
        >
          <optgroup label="Common">
            {featured.map((language) => (
              <option key={language.code} value={language.code}>{language.label}</option>
            ))}
          </optgroup>
          <optgroup label="More languages">
            {rest.map((language) => (
              <option key={language.code} value={language.code}>{language.label}</option>
            ))}
          </optgroup>
        </select>
      </label>

      <div className="field field-row">
        <label className="check">
          <input
            type="checkbox"
            name="grayscale"
            checked={settings.grayscale}
            onChange={(event) => onSettings({ grayscale: event.target.checked })}
          />
          Grayscale
        </label>
        <Hint text="Grayscale and extra contrast can help a photo of paper. They do not change the original file." />
      </div>

      <label className="field">
        <span>Contrast <strong>{settings.contrast.toFixed(1)}</strong></span>
        <input
          type="range"
          name="contrast"
          min={0.6}
          max={2.2}
          step={0.1}
          value={settings.contrast}
          onChange={(event) => onSettings({ contrast: Number(event.target.value) })}
          aria-valuetext={settings.contrast.toFixed(1)}
        />
      </label>

      <div className="field field-row">
        <label className="check">
          <input
            type="checkbox"
            name="show-boxes"
            checked={settings.showBoxes}
            onChange={(event) => onSettings({ showBoxes: event.target.checked })}
          />
          Show word boxes
        </label>
        <Hint text="Green is 85% confidence or better, yellow is 70 to 84, and red is below 70. Click a box to copy that word." />
      </div>

      <div className="run-row">
        <button type="button" className="btn btn-primary" onClick={onExtract} disabled={running || !item}>
          Extract text
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRerun} disabled={running || !item}>
          Re-run selected
        </button>
        <button type="button" className="btn btn-ghost" onClick={onStop} disabled={!running}>
          Stop
        </button>
      </div>

      {item?.status === 'running' && (
        <div
          className="bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={label}
        >
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
          <span className="bar-label">{label}</span>
        </div>
      )}
    </section>
  );
}
