import type { QueueItem } from '../types';

export function QueueList({
  items,
  selectedId,
  onSelect,
  onRemove,
}: {
  items: QueueItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="queue" aria-label="Image queue">
      <ol>
        {items.map((item, index) => (
          <li key={item.id} className={item.id === selectedId ? 'is-selected' : undefined}>
            <button type="button" className="queue-main" onClick={() => onSelect(item.id)}>
              <span className="queue-index">{index + 1}</span>
              <span className="queue-name">{item.name}</span>
              <span className={`queue-status status-${item.status}`}>
                {item.status === 'done' && item.recognition
                  ? `${Math.round(item.recognition.confidence)}%`
                  : item.progressLabel}
              </span>
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remove ${item.name}`}
              onClick={() => onRemove(item.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
