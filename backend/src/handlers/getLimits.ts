import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo';
import { DEFAULT_LIMITS, ProductCode } from '../lib/types';
import { json, badRequest } from '../lib/http';

const VALID_CODES: ProductCode[] = ['A', 'B', 'C', 'D'];

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const code = event.pathParameters?.['code'] as ProductCode | undefined;
  if (!code || !VALID_CODES.includes(code)) return badRequest('Unknown product code');

  const result = await ddb.send(new GetCommand({ TableName: TABLES.limits, Key: { productCode: code } }));

  return json(
    result.Item ?? {
      productCode: code,
      upperControlLimit: DEFAULT_LIMITS[code].ucl,
      lowerControlLimit: DEFAULT_LIMITS[code].lcl,
      notifyEmails: [],
    }
  );
}
