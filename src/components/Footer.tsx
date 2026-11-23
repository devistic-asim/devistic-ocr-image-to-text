export function Footer({
  confirming,
  onAskClear,
  onClear,
  onCancelClear,
}: {
  confirming: boolean;
  onAskClear: () => void;
  onClear: () => void;
  onCancelClear: () => void;
}) {
  return (
    <footer className="footer">
      <p>No account and no API key. The picture never leaves this browser.</p>
      <nav aria-label="Contact">
        <a href="https://github.com/devistic-asim" target="_blank" rel="noopener noreferrer">
          GitHub profile
        </a>
        <a
          href="https://github.com/devistic-asim/devistic-ocr-image-to-text"
          target="_blank"
          rel="noopener noreferrer"
        >
          Star or contribute
        </a>
      </nav>
      {confirming ? (
        <div className="clear-confirm">
          <button type="button" className="btn btn-danger" onClick={onClear}>
            Yes, erase local history and settings
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancelClear}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={onAskClear}>
          Clear my local data
        </button>
      )}
    </footer>
  );
}
