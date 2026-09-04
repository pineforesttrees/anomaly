export type ProductCode = 'A' | 'B' | 'C' | 'D';

export const PRODUCT_CODES: ProductCode[] = ['A', 'B', 'C', 'D'];

export type Timeframe = '1d' | '1w' | '1m' | '6m';

export interface TimeframeOption {
  value: Timeframe;
  label: string;
  /** How many data points the API should bucket the range into. */
  targetBuckets: number;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: '1d', label: '1 Day', targetBuckets: 24 },   // hourly buckets
  { value: '1w', label: '1 Week', targetBuckets: 28 },  // 6h buckets
  { value: '1m', label: '1 Month', targetBuckets: 30 }, // daily buckets
  { value: '6m', label: '6 Months', targetBuckets: 26 },// weekly buckets
];

/**
 * A single point on a control chart. `value` is intentionally the only numeric
 * field carried in the model — the UI never renders it as text, only as a
 * plotted position, per the "no visible sales figures" requirement.
 */
export interface ControlChartPoint {
  timestamp: string; // ISO-8601
  value: number;
}

export interface ControlLimits {
  productCode: ProductCode;
  upperControlLimit: number;
  lowerControlLimit: number;
  /** Optional centre line (process mean); purely visual, defaults to midpoint if omitted. */
  centerLine?: number;
  /** Email address(es) notified when a point breaches a limit. */
  notifyEmails: string[];
  updatedAt?: string;
}

export interface ProductSeries {
  productCode: ProductCode;
  timeframe: Timeframe;
  points: ControlChartPoint[];
  limits: ControlLimits;
}

export type ChartStatus = 'in-control' | 'breach-high' | 'breach-low';

export function evaluateStatus(series: ProductSeries): ChartStatus {
  const last = series.points.at(-1);
  if (!last) return 'in-control';
  if (last.value > series.limits.upperControlLimit) return 'breach-high';
  if (last.value < series.limits.lowerControlLimit) return 'breach-low';
  return 'in-control';
}
