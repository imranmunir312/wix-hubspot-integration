import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { FieldMapping } from '../mappings/field-mappings.entity';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { ContactLink } from '../contact-links/contact-link.entity';
import { WixAuthService } from './wix-auth/wix-auth.service';
import { WixContactsService } from './wix-contacts/wix-contacts.service';
import { WixWebhooksService } from './wix-webhooks/wix-webhooks.service';
import { WixSignatureService } from './wix-signature/wix-signature.service';
import { WixWebhooksController } from './wix-webhooks/wix-webhooks.controller';
import { HubspotModule } from '../hubspot/hubspot.module';
import { SyncModule } from '../sync/sync.module';
import { WixInstallController } from './wix-install/wix-install.controller';
import { WixInstallService } from './wix-install/wix-install.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Installation,
      FieldMapping,
      SyncEvent,
      ContactLink,
    ]),
    forwardRef(() => HubspotModule),
    SyncModule,
  ],
  providers: [
    WixAuthService,
    WixContactsService,
    WixWebhooksService,
    WixSignatureService,
    WixInstallService,
  ],
  exports: [WixAuthService, WixContactsService],
  controllers: [WixWebhooksController, WixInstallController],
})
export class WixModule {}
