import type { OcrBlock, OcrLine, OcrWord } from '../types';

/**
 * Layout preservation
 * -------------------
 * Tesseract already groups symbols into words, lines, paragraphs, and blocks,
 * and each of those has a bounding box. The plain text it returns throws that
 * geometry away. These functions put it back.
 *
 * Layout mode places every word on a character grid:
 *   column = round((word.x0 - leftMargin) / medianCharacterWidth)
 * Lines whose vertical centers are within half a line-height share a row, so
 * a left column and a right column stay on the same line with a run of spaces
 * between them. The cursor advances by each word's painted width, so a larger
 * font does not open a fake gap before the next word. A vertical gap taller
 * than the line itself becomes a blank line. Leading spaces keep indentation.
 *
 * Plain mode ignores the grid. It reads blocks in column order (a full-width
 * title first, then the left column top to bottom, then the right column) and
 * joins wrapped lines into paragraphs. A hyphen at the end of a line is glued
 * to the next line when that line starts with a letter.
 *
 * Right-to-left words are wrapped in Unicode isolates so the bidirectional
 * algorithm does not pull spatially placed words back together.
 */

const RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const BIDI_CONTROLS = /[\u2066-\u2069\u200E\u200F\u202A-\u202E]/g;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function visibleLength(text: string): number {
  return [...text.replace(BIDI_CONTROLS, '')].length;
}

function presentWord(text: string): string {
  return RTL_CHAR.test(text) ? `\u2066${text}\u2069` : text;
}

function linesOf(blocks: OcrBlock[]): OcrLine[] {
  const lines: OcrLine[] = [];
  for (const block of blocks) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        const words = line.words.filter((word) => word.text.trim().length > 0);
        if (words.length === 0 && line.text.trim().length === 0) continue;
        lines.push(words.length > 0 ? { ...line, words } : line);
      }
    }
  }
  return lines;
}

function wordsOf(line: OcrLine): OcrWord[] {
  if (line.words.length > 0) return line.words.filter((word) => word.text.trim());
  const text = line.text.trim();
  return text ? [{ text, confidence: line.confidence, bbox: line.bbox }] : [];
}

function centerY(line: OcrLine): number {
  return (line.bbox.y0 + line.bbox.y1) / 2;
}

interface Row {
  anchor: number;
  lines: OcrLine[];
}

function clusterRows(lines: OcrLine[], tolerance: number): Row[] {
  const sorted = [...lines].sort((a, b) => centerY(a) - centerY(b) || a.bbox.x0 - b.bbox.x0);
  const rows: Row[] = [];
  for (const line of sorted) {
    const y = centerY(line);
    const last = rows[rows.length - 1];
    if (last && Math.abs(y - last.anchor) <= tolerance) last.lines.push(line);
    else rows.push({ anchor: y, lines: [line] });
  }
  return rows;
}

function buildRow(words: OcrWord[], originX: number, charWidth: number): string {
  const sorted = [...words].sort((a, b) => a.bbox.x0 - b.bbox.x0 || a.bbox.y0 - b.bbox.y0);
  let cursor = 0;
  let previousEnd = originX;
  let out = '';
  for (const word of sorted) {
    const text = presentWord(word.text.trim());
    const length = visibleLength(text);
    if (length === 0) continue;
    const col = Math.max(0, Math.round((word.bbox.x0 - originX) / charWidth));
    const visual = Math.max(length, Math.round(Math.max(0, word.bbox.x1 - word.bbox.x0) / charWidth));
    const pixelGap = word.bbox.x0 - previousEnd;
    if (out.length === 0) {
      out = `${' '.repeat(Math.min(col, 400))}${text}`;
      cursor = col + visual;
    } else if (pixelGap <= charWidth * 2.4) {
      out += ` ${text}`;
      cursor += 1 + visual;
    } else if (col > cursor) {
      const spaces = Math.min(400, col - cursor);
      out += `${' '.repeat(spaces)}${text}`;
      cursor += spaces + visual;
    } else {
      out += ` ${text}`;
      cursor += 1 + visual;
    }
    previousEnd = word.bbox.x1;
  }
  return out.replace(/\s+$/u, '');
}

export function preserveLayout(blocks: OcrBlock[]): string {
  const lines = linesOf(blocks);
  if (lines.length === 0) return '';

  const allWords = lines.flatMap(wordsOf);
  if (allWords.length === 0) return '';

  const measured = allWords.filter((word) => visibleLength(word.text.trim()) >= 2);
  const sample = measured.length > 0 ? measured : allWords;
  const charWidth = median(
    sample.map((word) => {
      const length = Math.max(1, visibleLength(word.text.trim()));
      return Math.max(1, (word.bbox.x1 - word.bbox.x0) / length);
    }),
  ) || 8;

  const lineHeight = median(lines.map((line) => Math.max(1, line.bbox.y1 - line.bbox.y0))) || charWidth * 2;
  const originX = Math.min(...allWords.map((word) => word.bbox.x0));
  const rows = clusterRows(lines, lineHeight * 0.45);

  const output: string[] = [];
  let previousBottom: number | null = null;
  for (const row of rows) {
    const top = Math.min(...row.lines.map((line) => line.bbox.y0));
    const bottom = Math.max(...row.lines.map((line) => line.bbox.y1));
    const text = buildRow(row.lines.flatMap(wordsOf), originX, charWidth);
    if (!text.trim()) continue;
    if (previousBottom !== null && top - previousBottom > lineHeight * 1.05) output.push('');
    output.push(text);
    previousBottom = bottom;
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function columnSplit(blocks: OcrBlock[]): number | null {
  const x0 = Math.min(...blocks.map((block) => block.bbox.x0));
  const x1 = Math.max(...blocks.map((block) => block.bbox.x1));
  const y0 = Math.min(...blocks.map((block) => block.bbox.y0));
  const y1 = Math.max(...blocks.map((block) => block.bbox.y1));
  const width = x1 - x0;
  const height = y1 - y0;
  if (width < 40 || height < 40) return null;

  const bins = 40;
  const hist = new Array<number>(bins).fill(0);
  for (const block of blocks) {
    if (block.bbox.x1 - block.bbox.x0 > width * 0.7) continue;
    const start = clamp(Math.floor(((block.bbox.x0 - x0) / width) * bins), 0, bins - 1);
    const end = clamp(Math.floor(((block.bbox.x1 - x0) / width) * bins - 1e-6), 0, bins - 1);
    const blockHeight = Math.max(1, block.bbox.y1 - block.bbox.y0);
    for (let index = start; index <= end; index += 1) hist[index] += blockHeight;
  }

  const contentHeight = Math.max(...hist);
  if (contentHeight <= 0) return null;

  let best = -1;
  let bestValue = Infinity;
  for (let index = Math.floor(bins * 0.2); index < Math.ceil(bins * 0.8); index += 1) {
    if (hist[index] < contentHeight * 0.25 && hist[index] < bestValue) {
      bestValue = hist[index];
      best = index;
    }
  }
  if (best < 0) return null;

  const leftMass = hist.slice(0, best).reduce((sum, value) => sum + value, 0);
  const rightMass = hist.slice(best + 1).reduce((sum, value) => sum + value, 0);
  if (leftMass < contentHeight || rightMass < contentHeight) return null;
  return x0 + ((best + 0.5) / bins) * width;
}

function crossesSplit(block: OcrBlock, split: number, pageWidth: number): boolean {
  return split - block.bbox.x0 > pageWidth * 0.15 && block.bbox.x1 - split > pageWidth * 0.15;
}

/** Reading order for plain text: full-width bands, then the left column, then the right. */
export function orderBlocksForReading(blocks: OcrBlock[]): OcrBlock[] {
  if (blocks.length < 2) return [...blocks];
  const split = columnSplit(blocks);
  const byPosition = (a: OcrBlock, b: OcrBlock) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0;
  const sorted = [...blocks].sort(byPosition);
  if (split == null) return sorted;

  const pageWidth = Math.max(...blocks.map((block) => block.bbox.x1)) - Math.min(...blocks.map((block) => block.bbox.x0));
  const ordered: OcrBlock[] = [];
  let band: OcrBlock[] = [];
  const flush = () => {
    if (band.length === 0) return;
    const left = band.filter((block) => (block.bbox.x0 + block.bbox.x1) / 2 < split).sort(byPosition);
    const right = band.filter((block) => (block.bbox.x0 + block.bbox.x1) / 2 >= split).sort(byPosition);
    ordered.push(...left, ...right);
    band = [];
  };

  for (const block of sorted) {
    if (crossesSplit(block, split, pageWidth) || block.bbox.x1 - block.bbox.x0 > pageWidth * 0.7) {
      flush();
      ordered.push(block);
    } else {
      band.push(block);
    }
  }
  flush();
  return ordered;
}

function linePlain(line: OcrLine): string {
  const words = wordsOf(line);
  if (words.length > 1) return words.map((word) => word.text.trim()).filter(Boolean).join(' ');
  return line.text;
}

function joinParagraph(lines: string[]): string {
  let result = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!result) {
      result = line;
      continue;
    }
    if (result.endsWith('-') && /^[\p{L}]/u.test(line)) result = `${result.slice(0, -1)}${line}`;
    else result = `${result} ${line}`;
  }
  return result.replace(/[ \t]{2,}/g, ' ').trim();
}

function lineGutter(line: OcrLine): number | null {
  const words = wordsOf(line).sort((a, b) => a.bbox.x0 - b.bbox.x0);
  let best: { x: number; size: number } | null = null;
  for (let index = 1; index < words.length; index += 1) {
    const previous = words[index - 1];
    const current = words[index];
    const gap = current.bbox.x0 - previous.bbox.x1;
    const typical = Math.max(
      8,
      (previous.bbox.x1 - previous.bbox.x0) / Math.max(1, visibleLength(previous.text.trim())),
    );
    if (gap > typical * 3 && (!best || gap > best.size)) {
      best = { x: (previous.bbox.x1 + current.bbox.x0) / 2, size: gap };
    }
  }
  return best?.x ?? null;
}

function sharedGutter(lines: OcrLine[]): number | null {
  const gutters = lines.map(lineGutter).filter((value): value is number => value !== null);
  if (gutters.length < 2) return null;
  const middle = median(gutters);
  const close = gutters.filter((value) => Math.abs(value - middle) <= 80);
  if (close.length < 2) return null;
  return median(close);
}

function reflowParagraph(lines: OcrLine[], fallback: string): string {
  if (lines.length === 0) return fallback.trim();
  const chunks: string[] = [];
  let prose: OcrLine[] = [];
  let columns: OcrLine[] = [];

  const flushProse = () => {
    if (prose.length === 0) return;
    const text = joinParagraph(prose.map(linePlain));
    if (text) chunks.push(text);
    prose = [];
  };

  const flushColumns = () => {
    if (columns.length === 0) return;
    const gutter = sharedGutter(columns);
    if (gutter === null) {
      const text = joinParagraph(columns.map(linePlain));
      if (text) chunks.push(text);
    } else {
      const left: string[] = [];
      const right: string[] = [];
      for (const line of columns) {
        const words = wordsOf(line).sort((a, b) => a.bbox.x0 - b.bbox.x0);
        const leftWords = words.filter((word) => (word.bbox.x0 + word.bbox.x1) / 2 < gutter);
        const rightWords = words.filter((word) => (word.bbox.x0 + word.bbox.x1) / 2 >= gutter);
        if (leftWords.length > 0) left.push(leftWords.map((word) => word.text).join(' '));
        if (rightWords.length > 0) right.push(rightWords.map((word) => word.text).join(' '));
      }
      const leftText = joinParagraph(left);
      const rightText = joinParagraph(right);
      if (leftText) chunks.push(leftText);
      if (rightText) chunks.push(rightText);
    }
    columns = [];
  };

  for (const line of lines) {
    if (lineGutter(line) !== null) {
      flushProse();
      columns.push(line);
    } else {
      flushColumns();
      prose.push(line);
    }
  }
  flushProse();
  flushColumns();
  const joined = chunks.filter(Boolean).join('\n\n');
  return joined || fallback.trim();
}

export function reflowText(blocks: OcrBlock[]): string {
  const paragraphs: string[] = [];
  for (const block of orderBlocksForReading(blocks)) {
    for (const paragraph of block.paragraphs) {
      const text = reflowParagraph(paragraph.lines, paragraph.text);
      if (text) paragraphs.push(text);
    }
  }
  return paragraphs.join('\n\n');
}

export function weightedConfidence(blocks: OcrBlock[]): number {
  let weight = 0;
  let sum = 0;
  for (const line of linesOf(blocks)) {
    for (const word of wordsOf(line)) {
      const letters = Math.max(1, visibleLength(word.text.trim()));
      sum += word.confidence * letters;
      weight += letters;
    }
  }
  return weight === 0 ? 0 : sum / weight;
}

export function wordStats(blocks: OcrBlock[]): { count: number; low: number } {
  let count = 0;
  let low = 0;
  for (const line of linesOf(blocks)) {
    for (const word of wordsOf(line)) {
      count += 1;
      if (word.confidence < 70) low += 1;
    }
  }
  return { count, low };
}
