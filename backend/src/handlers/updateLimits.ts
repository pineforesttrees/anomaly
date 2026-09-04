import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo';
import { ControlLimitsRecord, ProductCode } from '../lib/types';
import { json, badRequest } from '../lib/http';

const VALID_CODES: ProductCode[] = ['A', 'B', 'C', 'D'];

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const code = event.pathParameters?.['code'] as ProductCode | undefined;
  if (!code || !VALID_CODES.includes(code)) return badRequest('Unknown product code');
  if (!event.body) return badRequest('Missing request body');

  let payload: Partial<ControlLimitsRecord>;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return badRequest('Invalid JSON body');
  }

  const { upperControlLimit, lowerControlLimit, centerLine, notifyEmails } = payload;
  if (typeof upperControlLimit !== 'number' || typeof lowerControlLimit !== 'number') {
    return badRequest('upperControlLimit and lowerControlLimit must be numbers');
  }
  if (lowerControlLimit >= upperControlLimit) {
    return badRequest('lowerControlLimit must be less than upperControlLimit');
  }

  const record: ControlLimitsRecord = {
    productCode: code,
    upperControlLimit,
    lowerControlLimit,
    centerLine,
    notifyEmails: Array.isArray(notifyEmails) ? notifyEmails : [],
    updatedAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: TABLES.limits, Item: record }));

  return json(record);
}
