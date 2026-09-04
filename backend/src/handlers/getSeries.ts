import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo';
import { rangeFor, bucketize } from '../lib/bucketing';
import { DEFAULT_LIMITS, ProductCode, SalesDataPoint, Timeframe } from '../lib/types';
import { json, badRequest } from '../lib/http';

const VALID_TIMEFRAMES: Timeframe[] = ['1d', '1w', '1m', '6m'];
const VALID_CODES: ProductCode[] = ['A', 'B', 'C', 'D'];

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const code = event.pathParameters?.['code'] as ProductCode | undefined;
  const timeframe = (event.queryStringParameters?.['timeframe'] ?? '1w') as Timeframe;

  if (!code || !VALID_CODES.includes(code)) return badRequest('Unknown product code');
  if (!VALID_TIMEFRAMES.includes(timeframe)) return badRequest('Unknown timeframe');

  const range = rangeFor(timeframe);

  const dataResult = await ddb.send(
    new QueryCommand({
      TableName: TABLES.sales,
      KeyConditionExpression: 'productCode = :p AND #ts BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: {
        ':p': code,
        ':start': range.startIso,
        ':end': range.endIso,
      },
    })
  );

  const points = bucketize((dataResult.Items ?? []) as SalesDataPoint[], range);

  const limitsResult = await ddb.send(
    new GetCommand({ TableName: TABLES.limits, Key: { productCode: code } })
  );
  const limits = limitsResult.Item ?? {
    productCode: code,
    upperControlLimit: DEFAULT_LIMITS[code].ucl,
    lowerControlLimit: DEFAULT_LIMITS[code].lcl,
    notifyEmails: [],
  };

  return json({
    productCode: code,
    timeframe,
    points,
    limits,
  });
}
