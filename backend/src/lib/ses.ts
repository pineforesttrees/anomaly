import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ProductCode } from './types';

const ses = new SESClient({});
const SENDER = process.env.SES_SENDER_EMAIL!;

export async function sendBreachEmail(
  productCode: ProductCode,
  status: 'breach-high' | 'breach-low',
  limitValue: number,
  recipients: string[]
): Promise<void> {
  if (recipients.length === 0) return;

  const direction = status === 'breach-high' ? 'above the upper' : 'below the lower';
  const subject = `[SPC Alert] Product ${productCode} out of control limits`;
  const body = [
    `Product ${productCode} has moved ${direction} control limit (${limitValue}).`,
    `Detected at: ${new Date().toISOString()}`,
    ``,
    `Open the dashboard to review the chart and adjust limits if needed.`,
  ].join('\n');

  await ses.send(
    new SendEmailCommand({
      Source: SENDER,
      Destination: { ToAddresses: recipients },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    })
  );
}
