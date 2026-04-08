import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { FieldMapping } from '../mappings/field-mappings.entity';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { AuthModule } from '../auth/auth.module';
import { SyncModule } from '../sync/sync.module';
import { HubSpotClientFactory } from './hubspot-client.factory';
import { HubspotPropertiesService } from './hubspot-properties.service';
import { HubspotContactsService } from './hubspot-contacts.service';
import { HubspotTokenService } from './hubspot-token/hubspot-token.service';
import { HubspotSignatureService } from './hubspot-signature/hubspot-signature.service';
import { HubspotWebhooksController } from './hubspot-webhooks/hubspot-webhooks.controller';
import { HubspotService } from './hubspot.service';
import { ContactLink } from '../contact-links/contact-link.entity';
import { WixModule } from '../wix/wix.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Installation,
      FieldMapping,
      SyncEvent,
      ContactLink,
    ]),
    AuthModule,
    SyncModule,
    forwardRef(() => WixModule), // To avoid circular dependency issues, if any. Adjust as needed based on actual dependencies.
  ],
  controllers: [HubspotWebhooksController],
  providers: [
    HubSpotClientFactory,
    HubspotPropertiesService,
    HubspotContactsService,
    HubspotTokenService,
    HubspotSignatureService,
    HubspotService,
  ],
  exports: [
    HubSpotClientFactory,
    HubspotPropertiesService,
    HubspotContactsService,
    HubspotTokenService,
    HubspotService,
  ],
})
export class HubspotModule {}
