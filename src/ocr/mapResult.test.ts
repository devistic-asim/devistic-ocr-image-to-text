import { describe, expect, it } from 'vitest';
import { mapRecognition } from './mapResult';

describe('mapRecognition', () => {
  it('keeps words and drops empty ones', () => {
    const document = mapRecognition({
      text: 'Hello\n',
      confidence: 87,
      blocks: [{
        text: 'Hello',
        confidence: 87,
        bbox: { x0: 1, y0: 2, x1: 30, y1: 20 },
        paragraphs: [{
          text: 'Hello',
          confidence: 90,
          is_ltr: true,
          bbox: { x0: 1, y0: 2, x1: 30, y1: 20 },
          lines: [{
            text: 'Hello ',
            confidence: 91,
            bbox: { x0: 1, y0: 2, x1: 30, y1: 20 },
            words: [
              { text: 'Hello', confidence: 96, bbox: { x0: 1, y0: 2, x1: 30, y1: 18 } },
              { text: ' ', confidence: 0, bbox: { x0: 30, y0: 2, x1: 34, y1: 18 } },
            ],
          }],
        }],
      }],
    });
    expect(document.confidence).toBe(87);
    expect(document.blocks[0].paragraphs[0].lines[0].words).toEqual([
      { text: 'Hello', confidence: 96, bbox: { x0: 1, y0: 2, x1: 30, y1: 18 } },
    ]);
    expect(document.blocks[0].paragraphs[0].lines[0].text).toBe('Hello');
  });

  it('wraps bare lines when a block has no paragraphs', () => {
    const document = mapRecognition({
      text: 'Only',
      confidence: 50,
      blocks: [{
        lines: [{ text: 'Only', confidence: 50, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 }, words: [] }],
      }],
    });
    expect(document.blocks).toHaveLength(1);
    expect(document.blocks[0].paragraphs[0].lines[0].text).toBe('Only');
  });

  it('survives a page with no blocks', () => {
    expect(mapRecognition({ text: 'plain', confidence: 10, blocks: null })).toEqual({
      text: 'plain',
      confidence: 10,
      blocks: [],
    });
  });
});
