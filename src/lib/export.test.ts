import { describe, expect, it } from 'vitest';
import { historyAsText, resultJson, resultMarkdown, safeBaseName } from './export';

describe('safeBaseName', () => {
  it('strips the extension and characters that do not belong in a file name', () => {
    expect(safeBaseName('My Note (1).PNG')).toBe('My-Note-1');
    expect(safeBaseName('...')).toBe('ocr');
  });
});

describe('exports', () => {
  it('puts layout text in a fence so spaces survive Markdown', () => {
    const markdown = resultMarkdown({
      fileName: 'page.png',
      language: 'eng',
      confidence: 91.2,
      layoutText: 'Name    Ada',
      plainText: 'Name Ada',
    });
    expect(markdown).toContain('Language: English (`eng`)');
    expect(markdown).toContain('```\nName    Ada\n```');
    expect(markdown).toContain('Mean confidence: 91%');
  });

  it('includes word boxes in the JSON download', () => {
    const json = resultJson({
      fileName: 'page.png',
      language: 'hin',
      confidence: 80,
      width: 10,
      height: 20,
      layoutText: 'Hi',
      plainText: 'Hi',
      blocks: [],
    });
    const parsed = JSON.parse(json) as { languageLabel: string; image: { width: number } };
    expect(parsed.languageLabel).toBe('Hindi');
    expect(parsed.image.width).toBe(10);
  });

  it('names every language in a combined spec', () => {
    const markdown = resultMarkdown({
      fileName: 'note.png',
      language: 'urd+eng',
      confidence: 80,
      layoutText: 'سلام Hello',
      plainText: 'سلام Hello',
    });
    expect(markdown).toContain('Language: Urdu + English (`urd+eng`)');
  });

  it('writes one section per history entry', () => {
    const text = historyAsText([{
      id: '1',
      createdAt: '2026-01-02T00:00:00.000Z',
      fileName: 'scan.png',
      language: 'ara',
      confidence: 77,
      layoutText: 'مرحبا',
      plainText: 'مرحبا',
    }]);
    expect(text).toContain('# Devistic OCR export');
    expect(text).toContain('## scan.png');
    expect(text).toContain('Language: Arabic');
    expect(text).toContain('مرحبا');
  });
});
