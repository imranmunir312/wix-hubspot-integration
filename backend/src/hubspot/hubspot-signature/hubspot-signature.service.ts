import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HubspotSignatureService {
  private static readonly MAX_AGE_MS = 5 * 60 * 1000;

  verifySignatureV3(params: {
    signature: string | undefined;
    method: string;
    requestUri: string;
    body: string;
    timestamp: string | undefined;
  }): true {
    const { signature, method, requestUri, body, timestamp } = params;

    if (!signature || !timestamp) {
      throw new BadRequestException('Missing HubSpot signature headers');
    }

    const timestampMs = Number(timestamp);
    if (!Number.isFinite(timestampMs)) {
      throw new BadRequestException('Invalid HubSpot timestamp');
    }

    const now = Date.now();
    if (Math.abs(now - timestampMs) > HubspotSignatureService.MAX_AGE_MS) {
      throw new BadRequestException('Expired HubSpot webhook timestamp');
    }

    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    if (!clientSecret) {
      throw new BadRequestException('Missing HubSpot client secret');
    }

    const normalizedUri = this.decodeHubSpotV3Uri(requestUri);
    const sourceString = `${method.toUpperCase()}${normalizedUri}${body}${timestamp}`;

    const expected = crypto
      .createHmac('sha256', clientSecret)
      .update(sourceString, 'utf8')
      .digest('base64');

    const provided = Buffer.from(signature, 'utf8');
    const computed = Buffer.from(expected, 'utf8');

    const valid =
      provided.length === computed.length &&
      crypto.timingSafeEqual(provided, computed);

    if (!valid) {
      throw new BadRequestException('Invalid HubSpot webhook signature');
    }

    return true;
  }

  private decodeHubSpotV3Uri(uri: string): string {
    return uri
      .replace(/%3A/gi, ':')
      .replace(/%2F/gi, '/')
      .replace(/%3F/gi, '?')
      .replace(/%40/gi, '@')
      .replace(/%21/gi, '!')
      .replace(/%24/gi, '$')
      .replace(/%27/gi, "'")
      .replace(/%28/gi, '(')
      .replace(/%29/gi, ')')
      .replace(/%2A/gi, '*')
      .replace(/%2C/gi, ',')
      .replace(/%3B/gi, ';');
  }
}
