import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// ---------------------------------------------------------------------
// This project defaults to DynamoDB because the exact AWS data store
// wasn't pinned down yet. If sales data actually lives in RDS or
// Timestream instead, this is the ONLY file (plus the two query calls in
// getSeries.ts and checkBreaches.ts) that needs to change — everything
// above this layer (handlers, frontend) talks to plain TS interfaces,
// not to DynamoDB directly.
// ---------------------------------------------------------------------

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  sales: process.env.SALES_TABLE!,
  limits: process.env.LIMITS_TABLE!,
  notifyState: process.env.NOTIFY_STATE_TABLE!,
};
