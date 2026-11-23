import { describe, expect, it } from 'vitest';
import { HISTORY_LIMIT, ImportError, defaultBundle, loadBundle, mergeBundles, parseBundle, saveBundle, serializeBundle } from './storage';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('storage', () => {
  it('round-trips settings and history', () => {
    const storage = memoryStorage();
    const bundle = defaultBundle();
    bundle.settings.language = 'urd';
    bundle.settings.outputMode = 'plain';
    bundle.history = [{
      id: 'h1',
      createdAt: '2026-01-01T00:00:00.000Z',
      fileName: 'note.png',
      language: 'urd',
      confidence: 88,
      layoutText: 'سلام',
      plainText: 'سلام',
    }];
    saveBundle(storage, bundle);
    const loaded = loadBundle(storage);
    expect(loaded.settings.language).toBe('urd');
    expect(loaded.settings.outputMode).toBe('plain');
    expect(loaded.history).toHaveLength(1);
    expect(loaded.history[0].layoutText).toBe('سلام');
  });

  it('rejects a file that is not an export', () => {
    expect(() => parseBundle('{"hello":1}')).toThrow(ImportError);
    expect(() => parseBundle('not json')).toThrow(ImportError);
  });

  it('merges history without duplicating ids and keeps the cap', () => {
    const current = defaultBundle();
    current.history = Array.from({ length: HISTORY_LIMIT }, (_, index) => ({
      id: `old-${index}`,
      createdAt: '2026-01-01T00:00:00.000Z',
      fileName: 'a.png',
      language: 'eng',
      confidence: 1,
      layoutText: 'a',
      plainText: 'a',
    }));
    const incoming = parseBundle(serializeBundle({
      ...defaultBundle(),
      theme: 'dark',
      settings: { ...defaultBundle().settings, grayscale: true },
      history: [
        current.history[0],
        {
          id: 'new-1',
          createdAt: '2026-02-01T00:00:00.000Z',
          fileName: 'b.png',
          language: 'hin',
          confidence: 70,
          layoutText: 'नया',
          plainText: 'नया',
        },
      ],
    }));
    const merged = mergeBundles(current, incoming);
    expect(merged.theme).toBe('dark');
    expect(merged.settings.grayscale).toBe(true);
    expect(merged.history[0].id).toBe('new-1');
    expect(merged.history.filter((entry) => entry.id === 'old-0')).toHaveLength(1);
    expect(merged.history).toHaveLength(HISTORY_LIMIT);
  });
});
