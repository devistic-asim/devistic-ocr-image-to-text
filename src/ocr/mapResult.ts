import type { Bbox, OcrBlock, OcrDocument, OcrLine, OcrParagraph, OcrWord } from '../types';

interface RawBox {
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}

interface RawWord {
  text?: string;
  confidence?: number;
  bbox?: RawBox;
}

interface RawLine {
  text?: string;
  confidence?: number;
  bbox?: RawBox;
  words?: RawWord[];
}

interface RawParagraph {
  text?: string;
  confidence?: number;
  bbox?: RawBox;
  is_ltr?: boolean;
  lines?: RawLine[];
}

interface RawBlock {
  text?: string;
  confidence?: number;
  bbox?: RawBox;
  paragraphs?: RawParagraph[];
  lines?: RawLine[];
}

export interface RawPage {
  text?: string | null;
  confidence?: number | null;
  blocks?: RawBlock[] | null;
}

const EMPTY: Bbox = { x0: 0, y0: 0, x1: 0, y1: 0 };

function box(value: RawBox | undefined): Bbox {
  return {
    x0: numberOr(value?.x0),
    y0: numberOr(value?.y0),
    x1: numberOr(value?.x1),
    y1: numberOr(value?.y1),
  };
}

function numberOr(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function mapWord(raw: RawWord): OcrWord | null {
  const text = (raw.text ?? '').trim();
  if (!text) return null;
  return { text, confidence: numberOr(raw.confidence), bbox: box(raw.bbox) };
}

function mapLine(raw: RawLine): OcrLine | null {
  const words = (raw.words ?? []).map(mapWord).filter((word): word is OcrWord => word !== null);
  const text = (raw.text ?? words.map((word) => word.text).join(' ')).replace(/\s+/g, ' ').trim();
  if (!text && words.length === 0) return null;
  return {
    text,
    confidence: numberOr(raw.confidence),
    bbox: box(raw.bbox),
    words,
  };
}

function mapParagraph(raw: RawParagraph): OcrParagraph | null {
  const lines = (raw.lines ?? []).map(mapLine).filter((line): line is OcrLine => line !== null);
  const text = (raw.text ?? lines.map((line) => line.text).join('\n')).trim();
  if (!text && lines.length === 0) return null;
  return {
    text,
    confidence: numberOr(raw.confidence),
    bbox: box(raw.bbox),
    isLtr: raw.is_ltr !== false,
    lines,
  };
}

function mapBlock(raw: RawBlock): OcrBlock | null {
  const paragraphs = (raw.paragraphs && raw.paragraphs.length > 0)
    ? raw.paragraphs
    : (raw.lines && raw.lines.length > 0 ? [{ lines: raw.lines, text: raw.text, confidence: raw.confidence, bbox: raw.bbox, is_ltr: true }] : []);
  const mapped = paragraphs.map(mapParagraph).filter((paragraph): paragraph is OcrParagraph => paragraph !== null);
  if (mapped.length === 0) return null;
  return {
    text: (raw.text ?? mapped.map((paragraph) => paragraph.text).join('\n')).trim(),
    confidence: numberOr(raw.confidence),
    bbox: box(raw.bbox ?? mapped[0]?.bbox ?? EMPTY),
    paragraphs: mapped,
  };
}

export function mapRecognition(page: RawPage): OcrDocument {
  const blocks = (page.blocks ?? []).map(mapBlock).filter((block): block is OcrBlock => block !== null);
  return {
    text: (page.text ?? '').trim(),
    confidence: numberOr(page.confidence),
    blocks,
  };
}
