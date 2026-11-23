import { describe, expect, it } from 'vitest';
import type { OcrBlock, OcrLine, OcrParagraph, OcrWord } from '../types';
import { orderBlocksForReading, preserveLayout, reflowText, visibleLength, weightedConfidence, wordStats } from './layout';

function word(text: string, x0: number, y0: number, x1: number, y1: number, confidence = 90): OcrWord {
  return { text, confidence, bbox: { x0, y0, x1, y1 } };
}

function line(text: string, words: OcrWord[], y0: number, y1: number): OcrLine {
  const x0 = Math.min(...words.map((item) => item.bbox.x0));
  const x1 = Math.max(...words.map((item) => item.bbox.x1));
  return { text, confidence: 90, bbox: { x0, y0, x1, y1 }, words };
}

function paragraph(lines: OcrLine[], isLtr = true): OcrParagraph {
  return {
    text: lines.map((item) => item.text).join('\n'),
    confidence: 90,
    isLtr,
    bbox: {
      x0: Math.min(...lines.map((item) => item.bbox.x0)),
      y0: Math.min(...lines.map((item) => item.bbox.y0)),
      x1: Math.max(...lines.map((item) => item.bbox.x1)),
      y1: Math.max(...lines.map((item) => item.bbox.y1)),
    },
    lines,
  };
}

function block(paragraphs: OcrParagraph[]): OcrBlock {
  return {
    text: paragraphs.map((item) => item.text).join('\n'),
    confidence: 90,
    bbox: {
      x0: Math.min(...paragraphs.map((item) => item.bbox.x0)),
      y0: Math.min(...paragraphs.map((item) => item.bbox.y0)),
      x1: Math.max(...paragraphs.map((item) => item.bbox.x1)),
      y1: Math.max(...paragraphs.map((item) => item.bbox.y1)),
    },
    paragraphs,
  };
}

describe('preserveLayout', () => {
  it('returns an empty string when there is nothing to place', () => {
    expect(preserveLayout([])).toBe('');
  });

  it('indents a line by its distance from the left margin', () => {
    const blocks = [
      block([
        paragraph([
          line('Hello', [word('Hello', 10, 0, 60, 20)], 0, 20),
          line('World', [word('World', 50, 24, 100, 44)], 24, 44),
        ]),
      ]),
    ];
    const text = preserveLayout(blocks);
    const rows = text.split('\n');
    expect(rows[0]).toBe('Hello');
    expect(rows[1]).toBe('    World');
  });

  it('inserts a blank line when the vertical gap is a paragraph break', () => {
    const blocks = [
      block([
        paragraph([
          line('One', [word('One', 0, 0, 30, 20)], 0, 20),
          line('Two', [word('Two', 0, 80, 30, 100)], 80, 100),
        ]),
      ]),
    ];
    expect(preserveLayout(blocks)).toBe('One\n\nTwo');
  });

  it('keeps a single space when the pixel gap is only about two characters', () => {
    const blocks = [
      block([
        paragraph([
          line('Hello There', [word('Hello', 0, 0, 50, 20), word('There', 70, 0, 120, 20)], 0, 20),
        ]),
      ]),
    ];
    expect(preserveLayout(blocks)).toBe('Hello There');
  });

  it('does not invent spaces after a word that is wider than the body text', () => {
    const blocks = [
      block([
        paragraph([
          line('W abcd', [word('W', 0, 0, 40, 20), word('abcd', 50, 0, 90, 20)], 0, 20),
        ]),
      ]),
    ];
    expect(preserveLayout(blocks)).toBe('W abcd');
  });

  it('keeps side-by-side columns on one row', () => {
    const blocks = [
      block([
        paragraph([
          line('Name', [word('Name', 0, 0, 40, 20)], 0, 20),
          line('Ada', [word('Ada', 200, 2, 230, 22)], 2, 22),
        ]),
      ]),
    ];
    const row = preserveLayout(blocks);
    expect(row).toContain('Name');
    expect(row).toContain('Ada');
    expect(row.split('\n')).toHaveLength(1);
    expect(row).toMatch(/Name {2,}Ada/);
  });

  it('isolates right-to-left words so the bidi algorithm leaves their columns alone', () => {
    const blocks = [
      block([
        paragraph([
          line('سلام', [word('سلام', 0, 0, 40, 20)], 0, 20),
        ], false),
      ]),
    ];
    const text = preserveLayout(blocks);
    expect(text).toContain('\u2066سلام\u2069');
    expect(visibleLength(text.trim())).toBe(4);
  });
});

describe('reflowText', () => {
  it('puts a space between words when the line string glued them together', () => {
    const blocks = [
      block([
        paragraph([
          line('متنہے', [word('متن', 0, 0, 40, 20), word('ہے', 50, 0, 80, 20)], 0, 20),
        ]),
      ]),
    ];
    expect(reflowText(blocks)).toBe('متن ہے');
  });

  it('joins wrapped lines and keeps paragraphs apart', () => {
    const blocks = [
      block([
        paragraph([
          line('Pack my', [word('Pack', 0, 0, 40, 20), word('my', 50, 0, 70, 20)], 0, 20),
          line('box', [word('box', 0, 24, 30, 44)], 24, 44),
        ]),
        paragraph([
          line('Done', [word('Done', 0, 100, 40, 120)], 100, 120),
        ]),
      ]),
    ];
    expect(reflowText(blocks)).toBe('Pack my box\n\nDone');
  });

  it('joins a line-break hyphen to the next line', () => {
    const blocks = [
      block([
        paragraph([
          line('recog-', [word('recog-', 0, 0, 70, 20)], 0, 20),
          line('nition', [word('nition', 0, 24, 60, 44)], 24, 44),
        ]),
      ]),
    ];
    expect(reflowText(blocks)).toBe('recognition');
  });

  it('reads a gutter inside one paragraph as a left column then a right column', () => {
    const blocks = [
      block([
        paragraph([
          line('Keep this sentence together.', [
            word('Keep', 0, 0, 40, 20),
            word('this', 50, 0, 90, 20),
            word('sentence', 100, 0, 180, 20),
            word('together.', 190, 0, 280, 20),
          ], 0, 20),
          line('Left one Right one', [
            word('Left', 0, 40, 40, 60),
            word('one', 50, 40, 90, 60),
            word('Right', 400, 40, 460, 60),
            word('one', 470, 40, 510, 60),
          ], 40, 60),
          line('Left two Right two', [
            word('Left', 0, 70, 40, 90),
            word('two', 50, 70, 90, 90),
            word('Right', 400, 70, 460, 90),
            word('two', 470, 70, 510, 90),
          ], 70, 90),
        ]),
      ]),
    ];
    expect(reflowText(blocks)).toBe('Keep this sentence together.\n\nLeft one Left two\n\nRight one Right two');
  });

  it('reads a full-width title, then the left column, then the right column', () => {
    const title = block([
      paragraph([line('Title', [word('Title', 0, 0, 1000, 40)], 0, 40)]),
    ]);
    const right = block([
      paragraph([line('Right', [word('Right', 600, 200, 900, 240)], 200, 240)]),
    ]);
    const left = block([
      paragraph([
        line('Left one', [word('Left', 0, 200, 200, 240)], 200, 240),
        line('Left two', [word('Two', 0, 260, 200, 300)], 260, 300),
      ]),
    ]);
    expect(orderBlocksForReading([right, title, left]).map((item) => item.paragraphs[0].lines[0].text)).toEqual([
      'Title',
      'Left one',
      'Right',
    ]);
    expect(reflowText([right, title, left])).toBe('Title\n\nLeft one Left two\n\nRight');
  });
});

describe('confidence', () => {
  it('weights confidence by the number of characters', () => {
    const blocks = [
      block([
        paragraph([
          line('aa b', [
            word('aa', 0, 0, 20, 10, 100),
            word('b', 30, 0, 40, 10, 0),
          ], 0, 10),
        ]),
      ]),
    ];
    expect(weightedConfidence(blocks)).toBeCloseTo(200 / 3);
    expect(wordStats(blocks)).toEqual({ count: 2, low: 1 });
  });
});
