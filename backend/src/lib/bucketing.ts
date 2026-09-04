import { SalesDataPoint, Timeframe } from './types';

interface RangeSpec {
  startIso: string;
  endIso: string;
  buckets: number;
}

const MS: Record<Timeframe, number> = {
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
  '6m': 182 * 24 * 60 * 60 * 1000,
};

const BUCKET_COUNT: Record<Timeframe, number> = {
  '1d': 24,
  '1w': 28,
  '1m': 30,
  '6m': 26,
};

export function rangeFor(timeframe: Timeframe, now = new Date()): RangeSpec {
  const end = now;
  const start = new Date(end.getTime() - MS[timeframe]);
  return { startIso: start.toISOString(), endIso: end.toISOString(), buckets: BUCKET_COUNT[timeframe] };
}

/**
 * Aggregates raw points into evenly spaced buckets (mean of each bucket),
 * so the chart shows a consistent number of points regardless of how
 * granular the underlying data is.
 */
export function bucketize(points: SalesDataPoint[], range: RangeSpec): { timestamp: string; value: number }[] {
  const start = new Date(range.startIso).getTime();
  const end = new Date(range.endIso).getTime();
  const span = end - start || 1;
  const bucketMs = span / range.buckets;

  const sums = new Array(range.buckets).fill(0);
  const counts = new Array(range.buckets).fill(0);

  for (const p of points) {
    const t = new Date(p.timestamp).getTime();
    let idx = Math.floor((t - start) / bucketMs);
    if (idx < 0) idx = 0;
    if (idx >= range.buckets) idx = range.buckets - 1;
    sums[idx] += p.value;
    counts[idx] += 1;
  }

  const result: { timestamp: string; value: number }[] = [];
  for (let i = 0; i < range.buckets; i++) {
    if (counts[i] === 0) continue; // skip empty buckets rather than plotting a false zero
    result.push({
      timestamp: new Date(start + bucketMs * (i + 0.5)).toISOString(),
      value: Number((sums[i] / counts[i]).toFixed(2)),
    });
  }
  return result;
}
