import { useEffect, useState } from 'react';
import { isRtlLanguage } from '../lib/languages';
import type { OutputMode } from '../lib/storage';
import { wordStats } from '../lib/layout';
import type { QueueItem } from '../types';
import { Hint } from './Hint';

export function ResultPanel({
  item,
  mode,
  copied,
  onMode,
  onChangeText,
  onCopy,
  onDownload,
}: {
  item: QueueItem | null;
  mode: OutputMode;
  copied: boolean;
  onMode: (mode: OutputMode) => void;
  onChangeText: (value: string) => void;
  onCopy: () => void;
  onDownload: (kind: 'txt' | 'md' | 'json') => void;
}) {
  const recognition = item?.recognition;
  const text = recognition ? (mode === 'layout' ? recognition.layoutText : recognition.plainText) : '';
  const stats = recognition ? wordStats(recognition.blocks) : null;
  const dir = recognition && mode === 'plain' && isRtlLanguage(recognition.language) ? 'rtl' : 'ltr';
  const narrow = useNarrow();

  return (
    <section className="result" id="output" aria-labelledby="output-heading">
      <div className="result-head">
        <h2 id="output-heading">Text</h2>
        <div className="segmented" role="radiogroup" aria-label="Output style">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'layout'}
            className={mode === 'layout' ? 'is-on' : undefined}
            onClick={() => onMode('layout')}
          >
            Layout
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'plain'}
            className={mode === 'plain' ? 'is-on' : undefined}
            onClick={() => onMode('plain')}
          >
            Plain
          </button>
        </div>
        <Hint text="Layout keeps line breaks, indents, and column gaps from the word positions. Plain joins wrapped lines into paragraphs you can edit." />
      </div>

      {recognition && (
        <div className="confidence">
          <div
            className="meter"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(recognition.confidence)}
            aria-label={`Mean confidence ${Math.round(recognition.confidence)} percent`}
          >
            <span className={band(recognition.confidence)} style={{ width: `${Math.min(100, recognition.confidence)}%` }} />
          </div>
          <p>
            <strong>{Math.round(recognition.confidence)}%</strong> mean confidence
            {stats ? ` · ${stats.count} words` : ''}
            {stats && stats.low > 0 ? ` · ${stats.low} below 70%` : ''}
          </p>
        </div>
      )}

      <textarea
        id="extracted-text"
        name="extracted-text"
        value={text}
        readOnly={!recognition}
        spellCheck={mode === 'plain'}
        dir={dir}
        wrap={mode === 'layout' && !narrow ? 'off' : 'soft'}
        className={mode === 'layout' ? 'mono' : undefined}
        placeholder={item ? 'Extract text to fill this box. You can edit the result before you copy it.' : 'Add an image to get started.'}
        aria-label={mode === 'layout' ? 'Layout text' : 'Plain text'}
        onChange={(event) => onChangeText(event.target.value)}
      />
      {mode === 'layout' && narrow && text && (
        <p className="fine">On a narrow screen these lines wrap so you can read them. Download the .txt file to keep the column spacing.</p>
      )}

      <div className="run-row">
        <button type="button" className="btn btn-primary" onClick={onCopy} disabled={!text}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onDownload('txt')} disabled={!recognition}>
          Download .txt
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onDownload('md')} disabled={!recognition}>
          Download .md
        </button>
        <span className="with-hint">
          <button type="button" className="btn btn-ghost" onClick={() => onDownload('json')} disabled={!recognition}>
            Download .json
          </button>
          <Hint text="JSON includes the text plus each word’s box and confidence, so you can rebuild the layout elsewhere." />
        </span>
      </div>
      {item?.error && <p className="error" role="alert">{item.error}</p>}
    </section>
  );
}

function useNarrow(): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)');
    const onChange = () => setMatches(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return matches;
}

function band(confidence: number): string {
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'mid';
  return 'low';
}
