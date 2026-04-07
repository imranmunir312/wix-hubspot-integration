import { Module } from '@nestjs/common';
import { HubSpotClientFactory } from './hubspot-client.factory';
import { HubspotContactsService } from './hubspot-contacts.service';
import { HubspotPropertiesService } from './hubspot-properties.service';

@Module({
  providers: [
    HubSpotClientFactory,
    HubspotContactsService,
    HubspotPropertiesService,
  ],
})
export class HubspotModule {}
