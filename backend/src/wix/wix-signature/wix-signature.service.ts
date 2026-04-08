import { BadRequestException, Injectable } from '@nestjs/common';

type WixWebhookJwtPayload = {
  instanceId?: string;
  siteId?: string;
  site?: {
    id?: string;
  };
  data?: {
    event?: {
      entityId?: string;
      id?: string;
      slug?: string;
      originatedFrom?: string;
    };
  };
};

@Injectable()
export class WixSignatureService {
  verifyAndDecodeJwt(token?: string): WixWebhookJwtPayload {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Missing Wix webhook JWT body');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new BadRequestException('Invalid Wix JWT format');
    }

    try {
      const { data } = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      );

      return JSON.parse(data) as WixWebhookJwtPayload;
    } catch {
      throw new BadRequestException('Failed to decode Wix webhook JWT');
    }
  }
}
