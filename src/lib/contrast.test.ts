import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

/**
 * These pairs are the text and button colors in src/index.css.
 * WCAG 2.2 AA needs 4.5:1 for normal text.
 */
const pairs: Array<[string, string, string]> = [
  ['#1E293B', '#F5F9FC', 'light text on background'],
  ['#1E293B', '#FFFFFF', 'light text on surface'],
  ['#4E5D6C', '#F5F9FC', 'light muted on background'],
  ['#4E5D6C', '#FFFFFF', 'light muted on surface'],
  ['#041910', '#20B683', 'button label on green'],
  ['#041910', '#1AA87A', 'button label on green hover'],
  ['#0B6B52', '#FFFFFF', 'light link'],
  ['#1E293B', '#FFEB5B', 'text on yellow'],
  ['#9F1D14', '#FFFFFF', 'light danger'],
  ['#F5F9FC', '#0B1220', 'dark text on background'],
  ['#F5F9FC', '#1E293B', 'dark text on surface'],
  ['#C5D0DC', '#0B1220', 'dark muted on background'],
  ['#C5D0DC', '#1E293B', 'dark muted on surface'],
  ['#8BE4F5', '#0B1220', 'dark link on background'],
  ['#8BE4F5', '#1E293B', 'dark link on surface'],
  ['#FFB4AB', '#1E293B', 'dark danger'],
];

describe('brand contrast', () => {
  it.each(pairs)('%s on %s (%s) meets AA', (foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
