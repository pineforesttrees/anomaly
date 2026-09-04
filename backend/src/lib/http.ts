import { APIGatewayProxyResultV2 } from 'aws-lambda';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
};

export function json(body: unknown, statusCode = 200): APIGatewayProxyResultV2 {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

export function badRequest(message: string): APIGatewayProxyResultV2 {
  return json({ message }, 400);
}
