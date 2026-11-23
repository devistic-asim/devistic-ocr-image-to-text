import { formatLanguageSpec } from './languages';

export const THEME_KEY = 'devistic-ocr:theme';
export const DATA_KEY = 'devistic-ocr:data';
export const NOTICE_KEY = 'devistic-ocr:privacy-ack';
export const HISTORY_LIMIT = 24;
export const APP_ID = 'devistic-ocr';

export type ThemeMode = 'light' | 'dark' | 'system';
export type OutputMode = 'layout' | 'plain';

export interface Settings {
  language: string;
  outputMode: OutputMode;
  grayscale: boolean;
  contrast: number;
  showBoxes: boolean;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  fileName: string;
  language: string;
  confidence: number;
  layoutText: string;
  plainText: string;
  preview?: string;
}

export interface DataBundle {
  version: 1;
  app: typeof APP_ID;
  exportedAt: string;
  theme: ThemeMode;
  settings: Settings;
  history: HistoryEntry[];
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'eng',
  outputMode: 'layout',
  grayscale: false,
  contrast: 1,
  showBoxes: true,
};

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export function defaultBundle(): DataBundle {
  return {
    version: 1,
    app: APP_ID,
    exportedAt: new Date(0).toISOString(),
    theme: 'system',
    settings: { ...DEFAULT_SETTINGS },
    history: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseTheme(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function parseSettings(value: unknown): Settings {
  const record = isRecord(value) ? value : {};
  const contrast = typeof record.contrast === 'number' && Number.isFinite(record.contrast)
    ? Math.min(2.5, Math.max(0.5, record.contrast))
    : 1;
  return {
    language: formatLanguageSpec(typeof record.language === 'string' ? record.language : 'eng'),
    outputMode: record.outputMode === 'plain' ? 'plain' : 'layout',
    grayscale: record.grayscale === true,
    contrast,
    showBoxes: record.showBoxes !== false,
  };
}

function parseHistoryEntry(value: unknown): HistoryEntry | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.fileName !== 'string') return null;
  if (typeof value.layoutText !== 'string' || typeof value.plainText !== 'string') return null;
  const confidence = typeof value.confidence === 'number' ? value.confidence : 0;
  const preview = typeof value.preview === 'string' && value.preview.length < 120_000 ? value.preview : undefined;
  return {
    id: value.id.slice(0, 80),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString(),
    fileName: value.fileName.slice(0, 180),
    language: formatLanguageSpec(typeof value.language === 'string' ? value.language : 'eng'),
    confidence: Math.min(100, Math.max(0, confidence)),
    layoutText: value.layoutText.slice(0, 200_000),
    plainText: value.plainText.slice(0, 200_000),
    preview,
  };
}

export function loadBundle(storage: Storage): DataBundle {
  const raw = storage.getItem(DATA_KEY);
  if (!raw) return defaultBundle();
  try {
    return parseBundle(raw);
  } catch {
    return defaultBundle();
  }
}

export function saveBundle(storage: Storage, bundle: DataBundle): void {
  const next = { ...bundle, history: bundle.history.slice(0, HISTORY_LIMIT) };
  try {
    storage.setItem(DATA_KEY, JSON.stringify(next));
  } catch {
    const withoutPreviews = {
      ...next,
      history: next.history.map((entry) => ({ ...entry, preview: undefined })),
    };
    storage.setItem(DATA_KEY, JSON.stringify(withoutPreviews));
  }
}

export function parseBundle(json: string): DataBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ImportError('That file is not valid JSON.');
  }
  if (!isRecord(parsed) || parsed.app !== APP_ID || parsed.version !== 1) {
    throw new ImportError('That file is not a Devistic OCR export.');
  }
  const history = Array.isArray(parsed.history)
    ? parsed.history.map(parseHistoryEntry).filter((entry): entry is HistoryEntry => entry !== null)
    : [];
  return {
    version: 1,
    app: APP_ID,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    theme: parseTheme(parsed.theme),
    settings: parseSettings(parsed.settings),
    history: history.slice(0, HISTORY_LIMIT),
  };
}

export function mergeBundles(current: DataBundle, incoming: DataBundle): DataBundle {
  const seen = new Set(current.history.map((entry) => entry.id));
  const imported = incoming.history.filter((entry) => !seen.has(entry.id));
  return {
    ...current,
    theme: incoming.theme,
    settings: incoming.settings,
    exportedAt: new Date().toISOString(),
    history: [...imported, ...current.history].slice(0, HISTORY_LIMIT),
  };
}

export function serializeBundle(bundle: DataBundle): string {
  return JSON.stringify({ ...bundle, exportedAt: new Date().toISOString() }, null, 2);
}
