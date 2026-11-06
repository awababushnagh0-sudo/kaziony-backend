/**
 * A store's average stars from its running total, to one decimal; null
 * before its first rating.
 */
export function ratingAverage(total: number, count: number): number | null {
  if (count === 0) return null;
  return Math.round((total / count) * 10) / 10;
}
