export type ProductCode = 'A' | 'B' | 'C' | 'D';
export type Timeframe = '1d' | '1w' | '1m' | '6m';

export interface SalesDataPoint {
  productCode: ProductCode;
  timestamp: string; // ISO-8601, sort key
  value: number;
}

export interface ControlLimitsRecord {
  productCode: ProductCode;
  upperControlLimit: number;
  lowerControlLimit: number;
  centerLine?: number;
  notifyEmails: string[];
  updatedAt: string;
}

export interface NotifyState {
  productCode: ProductCode;
  lastStatus: 'in-control' | 'breach-high' | 'breach-low';
  lastNotifiedAt?: string;
}

export const DEFAULT_LIMITS: Record<ProductCode, { ucl: number; lcl: number }> = {
  A: { ucl: 120, lcl: 40 },
  B: { ucl: 120, lcl: 40 },
  C: { ucl: 120, lcl: 40 },
  D: { ucl: 120, lcl: 40 },
};
