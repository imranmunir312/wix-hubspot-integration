import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ContactInfo } from '@wix/auto_sdk_crm_contacts';
import { Installation } from '../../installations/installation.entity';
import { WixSdkClientService } from '../wix-sdk-client/wix-sdk-client.service';

export type WixContactInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  [key: string]: unknown;
};

type WixContactSummary = {
  id: string;
  revision?: number;
};

type WixContactLike = {
  _id?: string;
  id?: string;
  revision?: number;
  primaryInfo?: {
    email?: string;
    phone?: string;
  };
  info?: {
    name?: {
      first?: string;
      last?: string;
    };
    emails?: {
      items?: Array<{
        email?: string;
        tag?: string;
        primary?: boolean;
      }>;
    };
    phones?: {
      items?: Array<{
        phone?: string;
        tag?: string;
        primary?: boolean;
      }>;
    };
    company?: string;
    jobTitle?: string;
  };
};

type WixQueryResult = {
  items?: WixContactLike[];
  contacts?: WixContactLike[];
};

type WixGetResult = {
  contact?: WixContactLike;
} & WixContactLike;

type WixCreateOrUpdateResult = {
  contact?: WixContactLike;
} & WixContactLike;

@Injectable()
export class WixContactsService {
  constructor(private readonly wixSdkClientService: WixSdkClientService) {}

  private toWixContactPayload(payload: WixContactInput): ContactInfo {
    return {
      name: {
        first: payload.firstName ?? '',
        last: payload.lastName ?? '',
      },
      emails: payload.email
        ? {
            items: [
              {
                tag: 'MAIN',
                email: payload.email,
                primary: true,
              },
            ],
          }
        : undefined,
      phones: payload.phone
        ? {
            items: [
              {
                tag: 'MAIN',
                phone: payload.phone,
                primary: true,
              },
            ],
          }
        : undefined,
      company: payload.company ?? '',
      jobTitle: payload.jobTitle ?? '',
    };
  }

  private requireContactId(id: string | undefined, context: string): string {
    if (!id) {
      throw new InternalServerErrorException(
        `Wix did not return a contact ID while ${context}`,
      );
    }

    return id;
  }

  private requireRevision(
    revision: number | undefined,
    context: string,
  ): number {
    if (revision === undefined) {
      throw new InternalServerErrorException(
        `Wix did not return a contact revision while ${context}`,
      );
    }

    return revision;
  }

  private extractContact(
    result: WixGetResult | WixCreateOrUpdateResult,
  ): WixContactLike {
    if (!result || typeof result !== 'object') {
      throw new InternalServerErrorException(
        'Wix returned an empty contact result',
      );
    }

    const candidate =
      (result as { contact?: WixContactLike }).contact ??
      (result as WixContactLike);

    if (!candidate || typeof candidate !== 'object') {
      throw new InternalServerErrorException(
        'Wix returned an invalid contact payload',
      );
    }

    return candidate;
  }

  private getContactId(contact: WixContactLike, context: string): string {
    const id = contact._id ?? contact.id;

    if (!id) {
      throw new InternalServerErrorException(
        `Wix did not return a contact ID while ${context}`,
      );
    }

    return id;
  }
  async findByEmail(
    installation: Installation,
    email: string,
  ): Promise<WixContactSummary | null> {
    if (!email.trim()) {
      throw new BadRequestException('Email is required');
    }

    const wixClient = this.wixSdkClientService.getClient(installation);

    const query = wixClient.contacts
      .queryContacts()
      .eq('primaryInfo.email', email.trim())
      .limit(1);

    const result = (await query.find()) as WixQueryResult;
    const item = result.items?.[0] ?? result.contacts?.[0] ?? null;

    if (!item) {
      return null;
    }

    return {
      id: this.requireContactId(item._id ?? item.id, 'querying contacts'),
      revision: item.revision,
    };
  }

  async getContactFull(
    installation: Installation,
    contactId: string,
  ): Promise<WixContactLike> {
    const wixClient = this.wixSdkClientService.getClient(installation);

    const result = (await wixClient.contacts.getContact(
      contactId,
    )) as WixGetResult;
    const contact = this.extractContact(result);

    this.getContactId(contact, 'getting a contact');

    return contact;
  }

  async createContact(
    installation: Installation,
    payload: WixContactInput,
  ): Promise<WixContactSummary> {
    const wixClient = this.wixSdkClientService.getClient(installation);

    const result = (await wixClient.contacts.createContact(
      this.toWixContactPayload(payload),
      { allowDuplicates: false },
    )) as WixCreateOrUpdateResult;

    const contact = this.extractContact(result);

    return {
      id: this.getContactId(contact, 'creating a contact'),
      revision: contact.revision,
    };
  }

  async updateContact(
    installation: Installation,
    contactId: string,
    payload: WixContactInput,
  ): Promise<WixContactSummary> {
    const wixClient = this.wixSdkClientService.getClient(installation);
    const existing = await this.getContactFull(installation, contactId);

    const result = (await wixClient.contacts.updateContact(
      contactId,
      this.toWixContactPayload(payload),
      this.requireRevision(existing.revision, 'loading contact before update'),
    )) as WixCreateOrUpdateResult;

    const contact = this.extractContact(result);

    return {
      id: this.getContactId(contact, 'updating a contact'),
      revision: contact.revision,
    };
  }
}
