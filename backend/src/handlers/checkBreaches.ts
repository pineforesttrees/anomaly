import { QueryCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo';
import { sendBreachEmail } from '../lib/ses';
import { ControlLimitsRecord, NotifyState, ProductCode, SalesDataPoint } from '../lib/types';

const PRODUCT_CODES: ProductCode[] = ['A', 'B', 'C', 'D'];

export async function handler(): Promise<void> {
  await Promise.all(PRODUCT_CODES.map(checkProduct));
}

async function checkProduct(productCode: ProductCode): Promise<void> {
  const [latestResult, limitsResult, stateResult] = await Promise.all([
    ddb.send(
      new QueryCommand({
        TableName: TABLES.sales,
        KeyConditionExpression: 'productCode = :p',
        ExpressionAttributeValues: { ':p': productCode },
        ScanIndexForward: false, // newest timestamp first
        Limit: 1,
      })
    ),
    ddb.send(new GetCommand({ TableName: TABLES.limits, Key: { productCode } })),
    ddb.send(new GetCommand({ TableName: TABLES.notifyState, Key: { productCode } })),
  ]);

  const latest = (latestResult.Items?.[0] as SalesDataPoint | undefined) ?? undefined;
  const limits = limitsResult.Item as ControlLimitsRecord | undefined;
  if (!latest || !limits) return;

  const status: NotifyState['lastStatus'] =
    latest.value > limits.upperControlLimit
      ? 'breach-high'
      : latest.value < limits.lowerControlLimit
        ? 'breach-low'
        : 'in-control';

  const previous = stateResult.Item as NotifyState | undefined;

  // Only email on a *transition into* a breach state, not on every poll
  // while it stays breached — otherwise recipients get an email every 5
  // minutes for the same ongoing issue.
  const shouldNotify = status !== 'in-control' && previous?.lastStatus !== status;

  if (shouldNotify) {
    const limitValue = status === 'breach-high' ? limits.upperControlLimit : limits.lowerControlLimit;
    await sendBreachEmail(productCode, status, limitValue, limits.notifyEmails ?? []);
  }

  await ddb.send(
    new PutCommand({
      TableName: TABLES.notifyState,
      Item: {
        productCode,
        lastStatus: status,
        lastNotifiedAt: shouldNotify ? new Date().toISOString() : previous?.lastNotifiedAt,
      } satisfies NotifyState,
    })
  );
}
