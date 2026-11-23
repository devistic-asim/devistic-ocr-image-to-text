import { describe, expect, it } from 'vitest';
import { progressFraction, progressLabel } from './progress';

describe('progressLabel', () => {
  it('names the language while its traineddata downloads', () => {
    expect(progressLabel('loading language traineddata', 'Urdu')).toBe('Downloading Urdu');
  });

  it('distinguishes engine startup from recognition', () => {
    expect(progressLabel('loading tesseract core', 'English')).toBe('Loading the OCR engine');
    expect(progressLabel('initializing api', 'English')).toBe('Starting the OCR engine');
    expect(progressLabel('recognizing text', 'English')).toBe('Reading text');
  });
});

describe('progressFraction', () => {
  it('accepts either a 0–1 fraction or a 0–100 percent', () => {
    expect(progressFraction(0.4)).toBeCloseTo(0.4);
    expect(progressFraction(40)).toBeCloseTo(0.4);
    expect(progressFraction(Number.NaN)).toBe(0);
    expect(progressFraction(250)).toBe(1);
  });
});
