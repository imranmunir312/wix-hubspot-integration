import { Injectable, Logger } from '@nestjs/common';
import { WixWebhookClientService } from '../wix-webhook-client/wix-webhook-client.service';
import { WixInstallService } from '../wix-install/wix-install.service';
import { WixWebhooksService } from '../wix-webhooks/wix-webhooks.service';

@Injectable()
export class WixWebhookHandlersService {
  private readonly logger = new Logger(WixWebhookHandlersService.name);
  private initialized = false;

  constructor(
    private readonly wixWebhookClientService: WixWebhookClientService,
    private readonly wixInstallService: WixInstallService,
    private readonly wixWebhooksService: WixWebhooksService,
  ) {}

  initialize() {
    if (this.initialized) return;

    const client = this.wixWebhookClientService.getClient();

    if (!client) {
      this.logger.warn(
        'Wix client is not available, skipping webhook handler initialization',
      );
      return;
    }

    client.appInstances.onAppInstanceInstalled(async (event) => {
      const instanceId = event.metadata.instanceId;
      if (!instanceId) {
        this.logger.warn(
          'Skipping app install webhook because instanceId is missing',
        );
        return;
      }

      this.logger.log(`onAppInstanceInstalled: instanceId=${instanceId}`);

      await this.wixInstallService.handleAppInstalledEvent({
        instanceId,
      });
    });

    client.contacts.onContactCreated(async (event) => {
      const instanceId = event.metadata.instanceId;
      const contactId = event.metadata.entityId ?? event.entity._id;

      if (!instanceId || !contactId) {
        this.logger.warn(
          `Skipping contact created webhook because identifiers are missing: instanceId=${instanceId ?? 'n/a'}, contactId=${contactId ?? 'n/a'}`,
        );
        return;
      }

      this.logger.log(
        `onContactCreated: instanceId=${instanceId}, contactId=${contactId}`,
      );

      await this.wixWebhooksService.handleContactEventFromSdk({
        instanceId,
        wixContactId: contactId,
        eventId: event.metadata._id,
        slug: 'created',
      });
    });

    client.contacts.onContactUpdated(async (event) => {
      const instanceId = event.metadata.instanceId;
      const contactId = event.metadata.entityId ?? event.entity._id;

      if (!instanceId || !contactId) {
        this.logger.warn(
          `Skipping contact updated webhook because identifiers are missing: instanceId=${instanceId ?? 'n/a'}, contactId=${contactId ?? 'n/a'}`,
        );
        return;
      }

      this.logger.log(
        `onContactUpdated: instanceId=${instanceId}, contactId=${contactId}`,
      );

      await this.wixWebhooksService.handleContactEventFromSdk({
        instanceId,
        wixContactId: contactId,
        eventId: event.metadata._id,
        slug: 'updated',
      });
    });

    this.initialized = true;
  }
}
