export function PrivacyNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="privacy" role="region" aria-label="Privacy">
      <p>
        We don&apos;t use cookies for tracking and we don&apos;t collect or store your data on any server.
        Everything stays in your browser on this device.
      </p>
      <button type="button" className="btn btn-primary" onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}
