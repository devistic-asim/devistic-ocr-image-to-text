export function Hint({ text }: { text: string }) {
  return (
    <span className="hint">
      <button type="button" className="hint-btn" aria-label={text}>
        <span aria-hidden="true">i</span>
      </button>
      <span role="tooltip" className="hint-pop">{text}</span>
    </span>
  );
}
