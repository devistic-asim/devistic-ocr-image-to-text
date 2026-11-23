export interface LanguageOption {
  code: string;
  label: string;
  rtl?: boolean;
  featured?: boolean;
}

/** Common Tesseract traineddata codes. Files download the first time each one is used. */
export const LANGUAGES: LanguageOption[] = [
  { code: 'eng', label: 'English', featured: true },
  { code: 'urd', label: 'Urdu', rtl: true, featured: true },
  { code: 'ara', label: 'Arabic', rtl: true, featured: true },
  { code: 'hin', label: 'Hindi', featured: true },
  { code: 'ben', label: 'Bengali' },
  { code: 'bul', label: 'Bulgarian' },
  { code: 'cat', label: 'Catalan' },
  { code: 'ces', label: 'Czech' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'chi_tra', label: 'Chinese (Traditional)' },
  { code: 'dan', label: 'Danish' },
  { code: 'nld', label: 'Dutch' },
  { code: 'fin', label: 'Finnish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'ell', label: 'Greek' },
  { code: 'guj', label: 'Gujarati' },
  { code: 'heb', label: 'Hebrew', rtl: true },
  { code: 'hun', label: 'Hungarian' },
  { code: 'ind', label: 'Indonesian' },
  { code: 'ita', label: 'Italian' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'kan', label: 'Kannada' },
  { code: 'kor', label: 'Korean' },
  { code: 'msa', label: 'Malay' },
  { code: 'mar', label: 'Marathi' },
  { code: 'nor', label: 'Norwegian' },
  { code: 'fas', label: 'Persian', rtl: true },
  { code: 'pol', label: 'Polish' },
  { code: 'por', label: 'Portuguese' },
  { code: 'pan', label: 'Punjabi' },
  { code: 'ron', label: 'Romanian' },
  { code: 'rus', label: 'Russian' },
  { code: 'spa', label: 'Spanish' },
  { code: 'swe', label: 'Swedish' },
  { code: 'tam', label: 'Tamil' },
  { code: 'tel', label: 'Telugu' },
  { code: 'tha', label: 'Thai' },
  { code: 'tur', label: 'Turkish' },
  { code: 'ukr', label: 'Ukrainian' },
  { code: 'vie', label: 'Vietnamese' },
];

export function languageByCode(code: string): LanguageOption {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

export function isRtlLanguage(code: string): boolean {
  return Boolean(languageByCode(code).rtl);
}
