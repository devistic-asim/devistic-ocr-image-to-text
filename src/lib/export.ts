import { formatLanguageSpec, languageLabel } from './languages';
import type { HistoryEntry } from './storage';
import type { OcrBlock } from '../types';

export function safeBaseName(name: string): string {
  const withoutExtension = name.replace(/\.[^.]+$/, '');
  const cleaned = withoutExtension
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  const hasLetterOrDigit = /[a-zA-Z0-9]/.test(cleaned);
  return (hasLetterOrDigit ? cleaned : '').slice(0, 80) || 'ocr';
}

export function resultMarkdown(input: {
  fileName: string;
  language: string;
  confidence: number;
  layoutText: string;
  plainText: string;
}): string {
  const spec = formatLanguageSpec(input.language);
  return [
    `# ${input.fileName}`,
    '',
    `- Language: ${languageLabel(spec)} (\`${spec}\`)`,
    `- Mean confidence: ${Math.round(input.confidence)}%`,
    '',
    '## Layout',
    '',
    fence(input.layoutText),
    '',
    '## Plain text',
    '',
    input.plainText.trim(),
    '',
  ].join('\n');
}

export function resultJson(input: {
  fileName: string;
  language: string;
  confidence: number;
  width: number;
  height: number;
  layoutText: string;
  plainText: string;
  blocks: OcrBlock[];
}): string {
  const spec = formatLanguageSpec(input.language);
  return JSON.stringify({
    app: 'devistic-ocr',
    version: 1,
    fileName: input.fileName,
    language: spec,
    languageLabel: languageLabel(spec),
    confidence: round(input.confidence),
    image: { width: input.width, height: input.height },
    layoutText: input.layoutText,
    plainText: input.plainText,
    blocks: input.blocks,
  }, null, 2);
}

export function historyAsText(entries: HistoryEntry[]): string {
  const parts = entries.map((entry) => {
    return [
      `## ${entry.fileName}`,
      `When: ${entry.createdAt}`,
      `Language: ${languageLabel(entry.language)}`,
      `Mean confidence: ${Math.round(entry.confidence)}%`,
      '',
      entry.layoutText.trim(),
      '',
    ].join('\n');
  });
  return [`# Devistic OCR export`, '', ...parts].join('\n').trimEnd() + '\n';
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fence(text: string): string {
  const longest = text.match(/`+/g)?.reduce((max, run) => Math.max(max, run.length), 0) ?? 0;
  const ticks = '`'.repeat(Math.max(3, longest + 1));
  return `${ticks}\n${text}\n${ticks}`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
