import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { FieldMapping } from '../mappings/field-mappings.entity';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { ContactLink } from '../contact-links/contact-link.entity';
import { WixAuthService } from './wix-auth/wix-auth.service';
import { WixContactsService } from './wix-contacts/wix-contacts.service';
import { WixWebhooksService } from './wix-webhooks/wix-webhooks.service';
import { WixWebhooksController } from './wix-webhooks/wix-webhooks.controller';
import { HubspotModule } from '../hubspot/hubspot.module';
import { SyncModule } from '../sync/sync.module';
import { WixInstallService } from './wix-install/wix-install.service';
import { WixWebhookClientService } from './wix-webhook-client/wix-webhook-client.service';
import { WixWebhookHandlersService } from './wix-webhook-handlers/wix-webhook-handlers.service';
import { ConfigModule } from '@nestjs/config';
import { WixSdkClientService } from './wix-sdk-client/wix-sdk-client.service';
import { FormContextEvent } from '../forms/form-context.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Installation,
      FieldMapping,
      SyncEvent,
      ContactLink,
      FormContextEvent,
    ]),
    forwardRef(() => HubspotModule),
    SyncModule,
  ],
  providers: [
    WixAuthService,
    WixContactsService,
    WixWebhooksService,
    WixInstallService,
    WixWebhookClientService,
    WixWebhookHandlersService,
    WixSdkClientService,
  ],
  exports: [WixAuthService, WixContactsService, WixSdkClientService],
  controllers: [WixWebhooksController],
})
export class WixModule {}
