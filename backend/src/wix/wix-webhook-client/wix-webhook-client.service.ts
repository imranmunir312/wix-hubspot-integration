import { Injectable } from '@nestjs/common';
import { AppStrategy, createClient, WixClient } from '@wix/sdk';
import { contacts } from '@wix/crm';
import { appInstances } from '@wix/app-management';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WixWebhookClientService {
  private readonly client: WixClient<
    undefined,
    AppStrategy,
    {
      contacts: typeof contacts;
      appInstances: typeof appInstances;
    }
  >;

  constructor(private readonly configService: ConfigService) {
    const appId = this.configService.get<string | null>('WIX_APP_ID');
    const publicKey = this.configService.get<string | null>(
      'WIX_APP_PUBLIC_KEY',
    );

    if (!appId || !publicKey) {
      throw new Error(
        'Missing WIX_APP_ID or WIX_APP_PUBLIC_KEY in configuration',
      );
    }
    this.client = createClient({
      auth: AppStrategy({
        appId,
        publicKey,
      }),
      modules: {
        contacts,
        appInstances,
      },
    });
  }

  getClient(): WixClient<
    undefined,
    AppStrategy,
    {
      contacts: typeof contacts;
      appInstances: typeof appInstances;
    }
  > {
    return this.client;
  }
}
