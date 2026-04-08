import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HubspotSignatureService {
  verifySignatureV3(params: {
    signature: string | undefined;
    method: string;
    uri: string;
    body: string;
    timestamp: string | undefined;
  }) {
    const { signature, method, uri, body, timestamp } = params;

    if (!signature || !timestamp) {
      throw new BadRequestException('Missing HubSpot signature headers');
    }

    const secret = process.env.HUBSPOT_CLIENT_SECRET!;
    const sourceString = method + uri + body + timestamp;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(sourceString)
      .digest('base64');

    if (signature !== expected) {
      throw new BadRequestException('Invalid HubSpot webhook signature');
    }

    const now = Date.now();
    const ts = Number(timestamp);

    if (Number.isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
      throw new BadRequestException('Expired HubSpot webhook timestamp');
    }

    return true;
  }
}
