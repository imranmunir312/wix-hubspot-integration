import { Injectable } from '@nestjs/common';
import { Property } from '@hubspot/api-client/lib/codegen/crm/properties';
import { HubSpotClientFactory } from './hubspot-client.factory';
import { HubSpotPropertySummary } from '../common/types/hubspot-property.types';

@Injectable()
export class HubspotPropertiesService {
  constructor(private readonly clientFactory: HubSpotClientFactory) {}

  async getContactProperties(
    accessToken: string,
  ): Promise<HubSpotPropertySummary[]> {
    const client = this.clientFactory.create(accessToken);

    const response = await client.crm.properties.coreApi.getAll('contacts');

    return response.results.map(
      (property: Property): HubSpotPropertySummary => ({
        name: property.name,
        label: property.label,
        type: property.type,
        fieldType: property.fieldType,
        groupName: property.groupName,
      }),
    );
  }
}
