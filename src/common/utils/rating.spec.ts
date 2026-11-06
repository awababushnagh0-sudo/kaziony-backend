import { describe, expect, it } from 'vitest';
import { ratingAverage } from './rating.js';

describe('ratingAverage', () => {
  it('is null before the first rating', () => {
    expect(ratingAverage(0, 0)).toBeNull();
  });

  it('rounds to one decimal', () => {
    expect(ratingAverage(14, 3)).toBe(4.7);
    expect(ratingAverage(9, 2)).toBe(4.5);
    expect(ratingAverage(5, 1)).toBe(5);
  });
});
