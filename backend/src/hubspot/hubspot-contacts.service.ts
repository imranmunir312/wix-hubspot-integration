import { Injectable } from '@nestjs/common';
import {
  FilterOperatorEnum,
  SimplePublicObjectInput,
  SimplePublicObjectInputForCreate,
} from '@hubspot/api-client/lib/codegen/crm/contacts';
import { HubSpotClientFactory } from './hubspot-client.factory';
import { HubSpotContactProperties } from '../common/types/hubspot-contact.types';

@Injectable()
export class HubspotContactsService {
  constructor(private readonly clientFactory: HubSpotClientFactory) {}

  private toHubSpotProperties(
    properties: HubSpotContactProperties,
  ): Record<string, string> {
    const sanitizedProperties: Record<string, string> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        sanitizedProperties[key] = value;
      }
    }

    return sanitizedProperties;
  }

  async getById(accessToken: string, contactId: string) {
    const client = this.clientFactory.create(accessToken);
    return client.crm.contacts.basicApi.getById(contactId);
  }

  async searchByEmail(accessToken: string, email: string) {
    const client = this.clientFactory.create(accessToken);

    const response = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: FilterOperatorEnum.Eq,
              value: email,
            },
          ],
        },
      ],
      limit: 1,
      properties: [
        'email',
        'firstname',
        'lastname',
        'phone',
        'company',
        'jobtitle',
      ],
    });

    return response.results[0] ?? null;
  }

  async create(accessToken: string, properties: HubSpotContactProperties) {
    const client = this.clientFactory.create(accessToken);

    const input: SimplePublicObjectInputForCreate = {
      properties: this.toHubSpotProperties(properties),
    };

    return client.crm.contacts.basicApi.create(input);
  }

  async update(
    accessToken: string,
    contactId: string,
    properties: HubSpotContactProperties,
  ) {
    const client = this.clientFactory.create(accessToken);

    const input: SimplePublicObjectInput = {
      properties: this.toHubSpotProperties(properties),
    };

    return client.crm.contacts.basicApi.update(contactId, input);
  }

  async upsertByEmail(
    accessToken: string,
    email: string,
    properties: HubSpotContactProperties,
  ) {
    const existing = await this.searchByEmail(accessToken, email);

    if (existing?.id) {
      return this.update(accessToken, existing.id, {
        ...properties,
        email,
      });
    }

    return this.create(accessToken, {
      ...properties,
      email,
    });
  }
}
