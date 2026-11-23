import { languageByCode } from '../lib/languages';
import type { HistoryEntry } from '../lib/storage';

export function HistoryPanel({
  entries,
  onOpen,
  onRemove,
  onExportJson,
  onExportText,
  onImport,
}: {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onExportJson: () => void;
  onExportText: () => void;
  onImport: () => void;
}) {
  return (
    <section className="history" aria-labelledby="history-heading">
      <div className="result-head">
        <h2 id="history-heading">On this device</h2>
        <div className="run-row">
          <button type="button" className="btn btn-ghost" onClick={onExportJson}>
            Export JSON
          </button>
          <button type="button" className="btn btn-ghost" onClick={onExportText}>
            Export text
          </button>
          <button type="button" className="btn btn-ghost" onClick={onImport}>
            Import JSON
          </button>
        </div>
      </div>
      <p className="fine">
        Results and settings stay in local storage on this browser. Import replaces settings and adds history entries that are not already here.
      </p>
      {entries.length === 0 ? (
        <p className="fine">No saved results yet. They appear here after you extract text.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              {entry.preview && <img src={entry.preview} alt="" />}
              <button type="button" className="queue-main" onClick={() => onOpen(entry)}>
                <span className="queue-name">{entry.fileName}</span>
                <span className="fine">
                  {languageByCode(entry.language).label} · {Math.round(entry.confidence)}% · {formatWhen(entry.createdAt)}
                </span>
              </button>
              <button type="button" className="icon-btn" aria-label={`Remove ${entry.fileName} from history`} onClick={() => onRemove(entry.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
