import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_PRESETS,
  LANGUAGES,
  formatLanguageSpec,
  isRtlSpec,
  languageLabel,
  languagesMatching,
  parseLanguageSpec,
  sameLanguageSet,
  toggleLanguage,
} from './languages';

describe('language specs', () => {
  it('combines Urdu and English in that order', () => {
    expect(formatLanguageSpec(['urd', 'eng'])).toBe('urd+eng');
    expect(languageLabel('urd+eng')).toBe('Urdu + English');
    expect(isRtlSpec('urd+eng')).toBe(true);
    expect(isRtlSpec('eng')).toBe(false);
  });

  it('drops unknown codes and duplicate picks', () => {
    expect(parseLanguageSpec('urd+nope+eng+urd')).toEqual(['urd', 'eng']);
    expect(parseLanguageSpec('not-a-language')).toEqual(['eng']);
    expect(formatLanguageSpec('fas+pus+snd+ben')).toBe('fas+pus+snd');
  });

  it('stops at three languages', () => {
    const first = toggleLanguage('eng', 'urd');
    expect(first).toEqual({ spec: 'eng+urd', limited: false });
    const full = toggleLanguage('eng+urd+ara', 'fas');
    expect(full.limited).toBe(true);
    expect(full.spec).toBe('eng+urd+ara');
    expect(parseLanguageSpec('eng+urd+ara+fas')).toEqual(['eng', 'urd', 'ara']);
  });

  it('offers an Urdu + English preset and treats order as the same set', () => {
    expect(LANGUAGE_PRESETS[0]).toEqual({ spec: 'urd+eng', label: 'Urdu + English' });
    expect(sameLanguageSet('eng+urd', 'urd+eng')).toBe(true);
  });

  it('searches by name, code, and alias', () => {
    expect(languagesMatching('farsi').map((language) => language.code)).toEqual(['fas']);
    expect(languagesMatching('pus').map((language) => language.code)).toContain('pus');
    expect(languagesMatching('sindhi').map((language) => language.code)).toEqual(['snd']);
  });
});

describe('catalog', () => {
  it('includes the requested languages and no duplicate codes', () => {
    const codes = LANGUAGES.map((language) => language.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toHaveLength(123);
    for (const code of ['fas', 'pus', 'snd', 'pan', 'ben', 'tur', 'fra', 'deu', 'spa', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'rus', 'por', 'ita', 'ind', 'msa', 'urd', 'ara', 'hin', 'eng']) {
      expect(codes).toContain(code);
    }
    expect(codes).not.toContain('osd');
  });
});
