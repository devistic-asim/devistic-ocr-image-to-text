export function progressLabel(status: string, languageLabel: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('recogn')) return 'Reading text';
  if (normalized.includes('language') || normalized.includes('traineddata')) {
    return `Downloading ${languageLabel}`;
  }
  if (normalized.includes('core') || normalized.includes('wasm') || normalized.includes('loading tesseract')) {
    return 'Loading the OCR engine';
  }
  if (normalized.includes('initial')) return 'Starting the OCR engine';
  return 'Working';
}

export function progressFraction(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  const value = progress > 1 ? progress / 100 : progress;
  return Math.min(1, Math.max(0, value));
}
