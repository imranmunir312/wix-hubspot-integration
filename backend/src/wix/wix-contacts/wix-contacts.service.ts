import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Installation } from '../../installations/installation.entity';
import { WixAuthService } from '../wix-auth/wix-auth.service';

export type WixContactInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  [key: string]: any;
};

type WixContactSummary = {
  id: string;
  revision?: number;
};

type WixQueryContactsResponse = {
  contacts?: Array<{
    id?: string;
    revision?: number;
    primaryInfo?: {
      email?: string;
    };
  }>;
};

type WixGetContactResponse = {
  contact?: {
    id?: string;
    revision?: number;
  };
};

type WixCreateContactResponse = {
  contact?: {
    id?: string;
    revision?: number;
  };
};

type WixUpdateContactResponse = {
  contact?: {
    id?: string;
    revision?: number;
  };
};

@Injectable()
export class WixContactsService {
  constructor(private readonly wixAuthService: WixAuthService) {}

  private readonly contactsBaseUrl =
    'https://www.wixapis.com/contacts/v4/contacts';

  private toWixContactInfo(payload: WixContactInput) {
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
        `Wix did not return a revision while ${context}`,
      );
    }

    return revision;
  }

  private async getHttpClient(
    installation: Installation,
  ): Promise<AxiosInstance> {
    const token = await this.wixAuthService.createAppAccessToken(installation);

    return axios.create({
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });
  }

  async findByEmail(
    installation: Installation,
    email: string,
  ): Promise<WixContactSummary | null> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const http = await this.getHttpClient(installation);

    const { data } = await http.post<WixQueryContactsResponse>(
      `${this.contactsBaseUrl}/query`,
      {
        query: {
          filter: {
            'primaryInfo.email': {
              $eq: email,
            },
          },
          paging: {
            limit: 1,
            offset: 0,
          },
        },
      },
    );

    const item = data.contacts?.[0] ?? null;
    if (!item) return null;

    return {
      id: this.requireContactId(item.id, 'querying contacts'),
      revision: item.revision,
    };
  }

  async getContact(
    installation: Installation,
    contactId: string,
  ): Promise<WixContactSummary> {
    const http = await this.getHttpClient(installation);

    const { data } = await http.get<WixGetContactResponse>(
      `${this.contactsBaseUrl}/${contactId}`,
    );

    const contact = data.contact;
    if (!contact) {
      throw new InternalServerErrorException('Wix did not return the contact');
    }

    return {
      id: this.requireContactId(contact.id, 'getting contact'),
      revision: this.requireRevision(contact.revision, 'getting contact'),
    };
  }

  async createContact(
    installation: Installation,
    payload: WixContactInput,
  ): Promise<WixContactSummary> {
    const http = await this.getHttpClient(installation);

    const { data } = await http.post<WixCreateContactResponse>(
      this.contactsBaseUrl,
      {
        info: this.toWixContactInfo(payload),
        allowDuplicates: false,
      },
    );

    const contact = data.contact;
    if (!contact) {
      throw new InternalServerErrorException(
        'Wix did not return the created contact',
      );
    }

    return {
      id: this.requireContactId(contact.id, 'creating a contact'),
      revision: contact.revision,
    };
  }

  async updateContact(
    installation: Installation,
    contactId: string,
    payload: WixContactInput,
  ): Promise<WixContactSummary> {
    const http = await this.getHttpClient(installation);
    const existing = await this.getContact(installation, contactId);

    const { data } = await http.patch<WixUpdateContactResponse>(
      `${this.contactsBaseUrl}/${contactId}`,
      {
        revision: this.requireRevision(
          existing.revision,
          'loading contact before update',
        ),
        info: this.toWixContactInfo(payload),
      },
    );

    const contact = data.contact;
    if (!contact) {
      throw new InternalServerErrorException(
        'Wix did not return the updated contact',
      );
    }

    return {
      id: this.requireContactId(contact.id, 'updating a contact'),
      revision: contact.revision,
    };
  }

  async getContactFull(
    installation: Installation,
    contactId: string,
  ): Promise<any> {
    try {
      const http = await this.getHttpClient(installation);
      const { data } = await http.get(
        `https://www.wixapis.com/contacts/v4/contacts/${contactId}`,
      );

      return data.contact ?? data;
    } catch (error) {
      console.error('Error fetching contact from Wix', error, {
        installationId: installation.id,
        contactId,
      });
      throw new InternalServerErrorException(
        'Failed to fetch contact from Wix',
      );
    }
  }
}
