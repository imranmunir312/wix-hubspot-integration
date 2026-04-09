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

    client.appInstances.onAppInstanceInstalled((event) => {
      const instanceId = event.metadata.instanceId;
      if (!instanceId) {
        this.logger.warn(
          'Skipping app install webhook because instanceId is missing',
        );
        return;
      }

      this.logger.log(`onAppInstanceInstalled: instanceId=${instanceId}`);

      this.wixInstallService
        .handleAppInstalledEvent({
          instanceId,
        })
        .catch((error: unknown) => {
          this.logger.error(
            `Failed async app-installed handling for instanceId=${event.metadata.instanceId}`,
            error instanceof Error ? error.stack : String(error),
          );
        });
    });

    client.contacts.onContactCreated((event) => {
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

      this.wixWebhooksService
        .handleContactEventFromSdk({
          instanceId,
          wixContactId: contactId,
          eventId: event.metadata._id,
          slug: 'created',
        })
        .catch((error: unknown) => {
          this.logger.error(
            `Failed async contact-created handling for instanceId=${event.metadata.instanceId}, contactId=${event.metadata.entityId}`,
            error instanceof Error ? error.stack : String(error),
          );
        });
    });

    client.contacts.onContactUpdated((event) => {
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

      this.wixWebhooksService
        .handleContactEventFromSdk({
          instanceId,
          wixContactId: contactId,
          eventId: event.metadata._id,
          slug: 'updated',
        })
        .catch((error: unknown) => {
          this.logger.error(
            `Failed async contact-updated handling for instanceId=${event.metadata.instanceId}, contactId=${event.metadata.entityId}`,
            error instanceof Error ? error.stack : String(error),
          );
        });
    });

    this.initialized = true;
  }
}
