import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { AuthModule } from '../auth/auth.module';
import { HubSpotClientFactory } from './hubspot-client.factory';
import { HubspotPropertiesService } from './hubspot-properties.service';
import { HubspotContactsService } from './hubspot-contacts.service';
import { HubspotTokenService } from './hubspot-token/hubspot-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([Installation]), AuthModule],
  providers: [
    HubspotTokenService,
    HubSpotClientFactory,
    HubspotPropertiesService,
    HubspotContactsService,
  ],
  exports: [
    HubSpotClientFactory,
    HubspotPropertiesService,
    HubspotContactsService,
    HubspotTokenService,
  ],
})
export class HubspotModule {}
