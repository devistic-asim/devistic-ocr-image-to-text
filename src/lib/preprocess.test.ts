import { describe, expect, it } from 'vitest';
import { contrastChannel, normalizeCrop } from './preprocess';

describe('contrastChannel', () => {
  it('leaves mid-gray and the endpoints stable at contrast 1', () => {
    expect(contrastChannel(128, 1)).toBe(128);
    expect(contrastChannel(0, 1)).toBe(0);
    expect(contrastChannel(255, 1)).toBe(255);
  });

  it('pushes a light gray toward white when contrast increases', () => {
    expect(contrastChannel(200, 1.8)).toBeGreaterThan(200);
  });

  it('stays inside 0–255', () => {
    expect(contrastChannel(255, 2.5)).toBe(255);
    expect(contrastChannel(0, 2.5)).toBe(0);
  });
});

describe('normalizeCrop', () => {
  it('orders the drag so the rectangle has a positive size', () => {
    expect(normalizeCrop(0.8, 0.6, 0.2, 0.1)).toEqual({ x: 0.2, y: 0.1, w: 0.6, h: 0.5 });
  });

  it('rejects a drag that is too small to be a real crop', () => {
    expect(normalizeCrop(0.4, 0.4, 0.405, 0.41)).toBeNull();
  });
});
