import { BadRequestException, Injectable } from '@nestjs/common';
import { AppStrategy, createClient } from '@wix/sdk';
import { contacts } from '@wix/crm';
import { Installation } from '../../installations/installation.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WixSdkClientService {
  constructor(private readonly configService: ConfigService) {}

  getClient(installation: Installation) {
    if (!installation.wixInstanceId) {
      throw new BadRequestException('Missing Wix instance ID on installation');
    }

    const appId = this.configService.get<string | null>('WIX_APP_ID');
    const appSecret = this.configService.get<string | null>('WIX_APP_SECRET');

    if (!appId || !appSecret) {
      throw new Error('Missing WIX_APP_ID or WIX_APP_SECRET in configuration');
    }

    return createClient({
      auth: AppStrategy({
        appId,
        appSecret,
        instanceId: installation.wixInstanceId,
      }),
      modules: { contacts },
    });
  }
}
