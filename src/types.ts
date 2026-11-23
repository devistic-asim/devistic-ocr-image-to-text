export interface Bbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: Bbox;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: Bbox;
  words: OcrWord[];
}

export interface OcrParagraph {
  text: string;
  confidence: number;
  bbox: Bbox;
  /** False for Arabic, Urdu, Hebrew, and other right-to-left paragraphs. */
  isLtr: boolean;
  lines: OcrLine[];
}

export interface OcrBlock {
  text: string;
  confidence: number;
  bbox: Bbox;
  paragraphs: OcrParagraph[];
}

export interface OcrDocument {
  text: string;
  confidence: number;
  blocks: OcrBlock[];
}

/** Crop rectangle as fractions of the rotated, uncropped image. */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ProcessOptions {
  grayscale: boolean;
  contrast: number;
  /** Quarter-turns in degrees: 0, 90, 180, 270, or any multiple. */
  rotation: number;
  /** Small deskew in degrees, added to rotation. */
  skew: number;
  crop: CropRect | null;
  applyCrop: boolean;
}

export type ItemStatus = 'ready' | 'running' | 'done' | 'error';

export interface Recognition {
  layoutText: string;
  plainText: string;
  confidence: number;
  width: number;
  height: number;
  blocks: OcrBlock[];
  language: string;
  grayscale: boolean;
  contrast: number;
  rotation: number;
  skew: number;
  crop: CropRect | null;
  historyId: string;
}

export interface QueueItem {
  id: string;
  name: string;
  sourceUrl: string;
  revoke: boolean;
  rotation: number;
  skew: number;
  crop: CropRect | null;
  status: ItemStatus;
  progress: number;
  progressLabel: string;
  error?: string;
  previewUrl?: string;
  recognition?: Recognition;
}
