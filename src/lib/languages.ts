export type LanguageGroup =
  | 'Common'
  | 'Europe'
  | 'East and Southeast Asia'
  | 'South Asia'
  | 'Middle East and Central Asia'
  | 'Africa'
  | 'Pacific and Americas'
  | 'Vertical text'
  | 'Historical and other';

export interface LanguageOption {
  code: string;
  label: string;
  group: LanguageGroup;
  rtl?: boolean;
  aliases?: string[];
}

/**
 * Every @tesseract.js-data package whose 4.0.0_best_int traineddata Tesseract.js
 * actually downloads. Orientation data (osd) and packages that 404 are omitted.
 */
export const LANGUAGES: LanguageOption[] = [
  { code: 'eng', label: 'English', group: 'Common' },
  { code: 'urd', label: 'Urdu', group: 'Common', rtl: true },
  { code: 'ara', label: 'Arabic', group: 'Common', rtl: true },
  { code: 'hin', label: 'Hindi', group: 'Common' },
  { code: 'fas', label: 'Persian', group: 'Common', rtl: true, aliases: ['farsi'] },
  { code: 'pus', label: 'Pashto', group: 'Common', rtl: true, aliases: ['pushto'] },
  { code: 'snd', label: 'Sindhi', group: 'Common', rtl: true },
  { code: 'pan', label: 'Punjabi', group: 'Common', aliases: ['panjabi'] },
  { code: 'ben', label: 'Bengali', group: 'Common' },
  { code: 'tur', label: 'Turkish', group: 'Common' },
  { code: 'fra', label: 'French', group: 'Common' },
  { code: 'deu', label: 'German', group: 'Common' },
  { code: 'spa', label: 'Spanish', group: 'Common' },
  { code: 'chi_sim', label: 'Chinese (Simplified)', group: 'Common' },
  { code: 'chi_tra', label: 'Chinese (Traditional)', group: 'Common' },
  { code: 'jpn', label: 'Japanese', group: 'Common' },
  { code: 'kor', label: 'Korean', group: 'Common' },
  { code: 'rus', label: 'Russian', group: 'Common' },
  { code: 'por', label: 'Portuguese', group: 'Common' },
  { code: 'ita', label: 'Italian', group: 'Common' },
  { code: 'ind', label: 'Indonesian', group: 'Common' },
  { code: 'msa', label: 'Malay', group: 'Common' },

  { code: 'sqi', label: 'Albanian', group: 'Europe' },
  { code: 'eus', label: 'Basque', group: 'Europe' },
  { code: 'bel', label: 'Belarusian', group: 'Europe' },
  { code: 'bos', label: 'Bosnian', group: 'Europe' },
  { code: 'bre', label: 'Breton', group: 'Europe' },
  { code: 'bul', label: 'Bulgarian', group: 'Europe' },
  { code: 'cat', label: 'Catalan', group: 'Europe' },
  { code: 'cos', label: 'Corsican', group: 'Europe' },
  { code: 'hrv', label: 'Croatian', group: 'Europe' },
  { code: 'ces', label: 'Czech', group: 'Europe' },
  { code: 'dan', label: 'Danish', group: 'Europe' },
  { code: 'nld', label: 'Dutch', group: 'Europe' },
  { code: 'est', label: 'Estonian', group: 'Europe' },
  { code: 'fao', label: 'Faroese', group: 'Europe' },
  { code: 'fin', label: 'Finnish', group: 'Europe' },
  { code: 'fry', label: 'Frisian', group: 'Europe' },
  { code: 'glg', label: 'Galician', group: 'Europe' },
  { code: 'ell', label: 'Greek', group: 'Europe' },
  { code: 'hun', label: 'Hungarian', group: 'Europe' },
  { code: 'isl', label: 'Icelandic', group: 'Europe' },
  { code: 'gle', label: 'Irish', group: 'Europe' },
  { code: 'lav', label: 'Latvian', group: 'Europe' },
  { code: 'lit', label: 'Lithuanian', group: 'Europe' },
  { code: 'ltz', label: 'Luxembourgish', group: 'Europe' },
  { code: 'mkd', label: 'Macedonian', group: 'Europe' },
  { code: 'mlt', label: 'Maltese', group: 'Europe' },
  { code: 'nor', label: 'Norwegian', group: 'Europe' },
  { code: 'oci', label: 'Occitan', group: 'Europe' },
  { code: 'pol', label: 'Polish', group: 'Europe' },
  { code: 'ron', label: 'Romanian', group: 'Europe' },
  { code: 'gla', label: 'Scottish Gaelic', group: 'Europe' },
  { code: 'srp', label: 'Serbian', group: 'Europe' },
  { code: 'srp_latn', label: 'Serbian (Latin)', group: 'Europe' },
  { code: 'slk', label: 'Slovak', group: 'Europe' },
  { code: 'slv', label: 'Slovenian', group: 'Europe' },
  { code: 'swe', label: 'Swedish', group: 'Europe' },
  { code: 'ukr', label: 'Ukrainian', group: 'Europe' },
  { code: 'cym', label: 'Welsh', group: 'Europe' },
  { code: 'yid', label: 'Yiddish', group: 'Europe', rtl: true },

  { code: 'mya', label: 'Burmese', group: 'East and Southeast Asia' },
  { code: 'ceb', label: 'Cebuano', group: 'East and Southeast Asia' },
  { code: 'fil', label: 'Filipino', group: 'East and Southeast Asia' },
  { code: 'jav', label: 'Javanese', group: 'East and Southeast Asia' },
  { code: 'khm', label: 'Khmer', group: 'East and Southeast Asia' },
  { code: 'lao', label: 'Lao', group: 'East and Southeast Asia' },
  { code: 'mon', label: 'Mongolian', group: 'East and Southeast Asia' },
  { code: 'sun', label: 'Sundanese', group: 'East and Southeast Asia' },
  { code: 'tha', label: 'Thai', group: 'East and Southeast Asia' },
  { code: 'bod', label: 'Tibetan', group: 'East and Southeast Asia' },
  { code: 'vie', label: 'Vietnamese', group: 'East and Southeast Asia' },

  { code: 'asm', label: 'Assamese', group: 'South Asia' },
  { code: 'div', label: 'Divehi', group: 'South Asia', rtl: true },
  { code: 'guj', label: 'Gujarati', group: 'South Asia' },
  { code: 'kan', label: 'Kannada', group: 'South Asia' },
  { code: 'mal', label: 'Malayalam', group: 'South Asia' },
  { code: 'mar', label: 'Marathi', group: 'South Asia' },
  { code: 'nep', label: 'Nepali', group: 'South Asia' },
  { code: 'ori', label: 'Odia', group: 'South Asia' },
  { code: 'san', label: 'Sanskrit', group: 'South Asia' },
  { code: 'sin', label: 'Sinhala', group: 'South Asia' },
  { code: 'tam', label: 'Tamil', group: 'South Asia' },
  { code: 'tel', label: 'Telugu', group: 'South Asia' },

  { code: 'hye', label: 'Armenian', group: 'Middle East and Central Asia' },
  { code: 'aze', label: 'Azerbaijani', group: 'Middle East and Central Asia' },
  { code: 'aze_cyrl', label: 'Azerbaijani (Cyrillic)', group: 'Middle East and Central Asia' },
  { code: 'kat', label: 'Georgian', group: 'Middle East and Central Asia' },
  { code: 'heb', label: 'Hebrew', group: 'Middle East and Central Asia', rtl: true },
  { code: 'kaz', label: 'Kazakh', group: 'Middle East and Central Asia' },
  { code: 'kmr', label: 'Kurdish (Kurmanji)', group: 'Middle East and Central Asia' },
  { code: 'kir', label: 'Kyrgyz', group: 'Middle East and Central Asia' },
  { code: 'syr', label: 'Syriac', group: 'Middle East and Central Asia', rtl: true },
  { code: 'tgk', label: 'Tajik', group: 'Middle East and Central Asia' },
  { code: 'uig', label: 'Uyghur', group: 'Middle East and Central Asia', rtl: true },
  { code: 'uzb', label: 'Uzbek', group: 'Middle East and Central Asia' },
  { code: 'uzb_cyrl', label: 'Uzbek (Cyrillic)', group: 'Middle East and Central Asia' },

  { code: 'afr', label: 'Afrikaans', group: 'Africa' },
  { code: 'amh', label: 'Amharic', group: 'Africa' },
  { code: 'swa', label: 'Swahili', group: 'Africa' },
  { code: 'tir', label: 'Tigrinya', group: 'Africa' },
  { code: 'yor', label: 'Yoruba', group: 'Africa' },

  { code: 'chr', label: 'Cherokee', group: 'Pacific and Americas' },
  { code: 'iku', label: 'Inuktitut', group: 'Pacific and Americas' },
  { code: 'mri', label: 'Maori', group: 'Pacific and Americas' },
  { code: 'que', label: 'Quechua', group: 'Pacific and Americas' },
  { code: 'ton', label: 'Tongan', group: 'Pacific and Americas' },

  { code: 'chi_sim_vert', label: 'Chinese (Simplified, vertical)', group: 'Vertical text' },
  { code: 'chi_tra_vert', label: 'Chinese (Traditional, vertical)', group: 'Vertical text' },
  { code: 'jpn_vert', label: 'Japanese (vertical)', group: 'Vertical text' },
  { code: 'kor_vert', label: 'Korean (vertical)', group: 'Vertical text' },

  { code: 'grc', label: 'Ancient Greek', group: 'Historical and other' },
  { code: 'epo', label: 'Esperanto', group: 'Historical and other' },
  { code: 'frk', label: 'Frankish', group: 'Historical and other' },
  { code: 'kat_old', label: 'Georgian (old)', group: 'Historical and other' },
  { code: 'ita_old', label: 'Italian (old)', group: 'Historical and other' },
  { code: 'lat', label: 'Latin', group: 'Historical and other' },
  { code: 'enm', label: 'Middle English', group: 'Historical and other' },
  { code: 'frm', label: 'Middle French', group: 'Historical and other' },
  { code: 'spa_old', label: 'Spanish (old)', group: 'Historical and other' },
];

export const LANGUAGE_GROUP_ORDER: LanguageGroup[] = [
  'Common',
  'Europe',
  'East and Southeast Asia',
  'South Asia',
  'Middle East and Central Asia',
  'Africa',
  'Pacific and Americas',
  'Vertical text',
  'Historical and other',
];

export const MAX_LANGUAGES = 3;

export const LANGUAGE_PRESETS: Array<{ spec: string; label: string }> = [
  { spec: 'urd+eng', label: 'Urdu + English' },
  { spec: 'ara+eng', label: 'Arabic + English' },
  { spec: 'fas+eng', label: 'Persian + English' },
];

const BY_CODE = new Map(LANGUAGES.map((language) => [language.code, language]));

export function languageByCode(code: string): LanguageOption {
  return BY_CODE.get(code) ?? LANGUAGES[0];
}

/** Split a Tesseract spec such as `urd+eng`, drop unknown codes, and keep at most three. */
export function parseLanguageSpec(value: string | undefined | null): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const part of (value ?? '').split('+')) {
    const code = part.trim().toLowerCase();
    if (!code || !BY_CODE.has(code) || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
    if (codes.length >= MAX_LANGUAGES) break;
  }
  return codes.length > 0 ? codes : ['eng'];
}

export function formatLanguageSpec(value: string | string[]): string {
  const raw = Array.isArray(value) ? value.join('+') : value;
  return parseLanguageSpec(raw).join('+');
}

export function languageLabel(spec: string): string {
  return parseLanguageSpec(spec).map((code) => languageByCode(code).label).join(' + ');
}

export function isRtlLanguage(code: string): boolean {
  return Boolean(languageByCode(code).rtl);
}

export function isRtlSpec(spec: string): boolean {
  return parseLanguageSpec(spec).some((code) => languageByCode(code).rtl);
}

export function sameLanguageSet(left: string, right: string): boolean {
  const a = [...parseLanguageSpec(left)].sort().join('+');
  const b = [...parseLanguageSpec(right)].sort().join('+');
  return a === b;
}

export function toggleLanguage(spec: string, code: string): { spec: string; limited: boolean } {
  if (!BY_CODE.has(code)) return { spec: formatLanguageSpec(spec), limited: false };
  const current = parseLanguageSpec(spec);
  if (current.includes(code)) {
    const next = current.filter((item) => item !== code);
    return { spec: formatLanguageSpec(next.join('+')), limited: false };
  }
  if (current.length >= MAX_LANGUAGES) return { spec: formatLanguageSpec(current.join('+')), limited: true };
  return { spec: formatLanguageSpec([...current, code].join('+')), limited: false };
}

export function languagesMatching(query: string): LanguageOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return LANGUAGES;
  return LANGUAGES.filter((language) => {
    const haystack = [language.label, language.code, ...(language.aliases ?? [])].join(' ').toLowerCase();
    return haystack.includes(needle);
  });
}
