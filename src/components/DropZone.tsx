import { Hint } from './Hint';

export function DropZone({
  compact,
  onBrowse,
  onPaste,
  onSample,
}: {
  compact: boolean;
  onBrowse: () => void;
  onPaste: () => void;
  onSample: () => void;
}) {
  return (
    <section className={compact ? 'drop compact' : 'drop'} aria-labelledby="add-heading">
      <div>
        <h1 id="add-heading">Read the text in an image</h1>
        <p>
          Drop images here, or paste with <kbd>Ctrl</kbd>+<kbd>V</kbd> or <kbd>⌘</kbd>+<kbd>V</kbd> anywhere on the page.
          Several images wait in a queue. Nothing is uploaded.
        </p>
      </div>
      <div className="drop-actions">
        <button type="button" className="btn btn-primary" onClick={onBrowse}>
          Upload images
        </button>
        <span className="with-hint">
          <button type="button" className="btn btn-ghost" onClick={onPaste}>
            Paste
          </button>
          <Hint text="The Paste button needs clipboard permission. Ctrl+V or ⌘V works without that prompt." />
        </span>
        <span className="with-hint">
          <button type="button" className="btn btn-ghost" onClick={onSample}>
            Try a sample
          </button>
          <Hint text="A short page with a paragraph, an indent, and two columns, so you can see how layout is kept." />
        </span>
      </div>
      <p className="fine">PNG, JPEG, WEBP, GIF, or BMP.</p>
    </section>
  );
}
