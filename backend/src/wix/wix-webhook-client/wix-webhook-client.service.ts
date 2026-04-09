import { Injectable } from '@nestjs/common';
import { AppStrategy, createClient, WixClient } from '@wix/sdk';
import { contacts } from '@wix/crm';
import { appInstances, embeddedScripts } from '@wix/app-management';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WixWebhookClientService {
  private readonly client: WixClient<
    undefined,
    AppStrategy,
    {
      contacts: typeof contacts;
      appInstances: typeof appInstances;
      embeddedScripts: typeof embeddedScripts;
    }
  >;

  constructor(private readonly configService: ConfigService) {
    const appId = this.configService.get<string | null>('WIX_APP_ID');
    const publicKey = this.configService.get<string | null>(
      'WIX_APP_PUBLIC_KEY',
    );
    const appSecret = this.configService.get<string | null>('WIX_APP_SECRET');

    if (!appId || !publicKey || !appSecret) {
      throw new Error(
        'Missing WIX_APP_ID or WIX_APP_PUBLIC_KEY or WIX_APP_SECRET in configuration',
      );
    }
    this.client = createClient({
      auth: AppStrategy({
        appId,
        publicKey,
        appSecret,
      }),
      modules: {
        contacts,
        appInstances,
        embeddedScripts,
      },
    });
  }

  getClient(): WixClient<
    undefined,
    AppStrategy,
    {
      contacts: typeof contacts;
      appInstances: typeof appInstances;
      embeddedScripts: typeof embeddedScripts;
    }
  > {
    return this.client;
  }
}
