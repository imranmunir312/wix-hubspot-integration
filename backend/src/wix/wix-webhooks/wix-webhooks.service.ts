import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Installation } from '../../installations/installation.entity';
import { FieldMapping } from '../../mappings/field-mappings.entity';
import { SyncEvent } from '../../sync-events/sync-event.entity';
import { ContactLink } from '../../contact-links/contact-link.entity';
import { HubspotTokenService } from '../../hubspot/hubspot-token/hubspot-token.service';
import { HubspotContactsService } from '../../hubspot/hubspot-contacts.service';
import { MapperService } from '../../sync/mapper/mapper.service';
import { HashService } from '../../sync/hash/hash.service';
import { DedupeService } from '../../sync/dedupe/dedupe.service';
import { WixContactsService } from '../wix-contacts/wix-contacts.service';
import { FormContextEvent } from '../../forms/form-context.entity';
import {
  EntityType,
  SyncSource,
  SyncStatus,
} from '../../common/enums/sync.enums';

type WixNormalizedContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
};

type ContextAwareWixSource = WixNormalizedContact & {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  page_url?: string;
  referrer_url?: string;
  submitted_at?: string;
};

@Injectable()
export class WixWebhooksService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    @InjectRepository(FieldMapping)
    private readonly mappingRepo: Repository<FieldMapping>,
    @InjectRepository(SyncEvent)
    private readonly syncEventRepo: Repository<SyncEvent>,
    @InjectRepository(ContactLink)
    private readonly contactLinkRepo: Repository<ContactLink>,
    @InjectRepository(FormContextEvent)
    private readonly formContextRepo: Repository<FormContextEvent>,
    private readonly wixContactsService: WixContactsService,
    private readonly hubspotTokenService: HubspotTokenService,
    private readonly hubspotContactsService: HubspotContactsService,
    private readonly mapperService: MapperService,
    private readonly hashService: HashService,
    private readonly dedupeService: DedupeService,
  ) {}

  async handleContactEventFromSdk(input: {
    instanceId: string;
    wixContactId: string;
    eventId?: string;
    slug: 'created' | 'updated';
  }) {
    const { instanceId, wixContactId, slug } = input;
    const eventId = input.eventId ?? crypto.randomUUID();

    const installation = await this.installationRepo.findOne({
      where: { wixInstanceId: instanceId },
    });

    if (!installation) {
      throw new BadRequestException('No installation found for Wix instance');
    }

    const wixContact = await this.wixContactsService.getContactFull(
      installation,
      wixContactId,
    );

    const mappings = await this.mappingRepo.find({
      where: { installationId: installation.id, isEnabled: true },
      order: { createdAt: 'ASC' },
    });

    if (!mappings.length) {
      await this.syncEventRepo.save(
        this.syncEventRepo.create({
          installationId: installation.id,
          eventSource: SyncSource.WIX,
          eventType: `contact.${slug}`,
          entityType: EntityType.CONTACT,
          entityId: wixContactId,
          correlationId: eventId,
          status: SyncStatus.SKIPPED,
          payloadRedacted: {
            reason: 'no_mappings_configured',
          },
        }),
      );

      return { ok: true, skipped: true };
    }

    const wixNormalized = this.normalizeWixContact(wixContact);
    const latestContext = await this.getLatestContextForEmail(
      wixNormalized.email,
    );

    const wixSource = this.buildContextAwareWixSource(
      wixNormalized,
      latestContext,
      mappings,
    );

    const hubspotPayload = this.mapperService.mapWixToHubSpot(
      wixSource,
      mappings,
    );

    if (!hubspotPayload || Object.keys(hubspotPayload).length === 0) {
      await this.syncEventRepo.save(
        this.syncEventRepo.create({
          installationId: installation.id,
          eventSource: SyncSource.WIX,
          eventType: `contact.${slug}`,
          entityType: EntityType.CONTACT,
          entityId: wixContactId,
          correlationId: eventId,
          status: SyncStatus.SKIPPED,
          payloadRedacted: {
            reason: 'empty_mapped_payload',
            email: wixNormalized.email ?? null,
          },
        }),
      );

      return { ok: true, skipped: true };
    }

    const email =
      typeof hubspotPayload.email === 'string'
        ? hubspotPayload.email.trim()
        : '';

    if (!email) {
      await this.syncEventRepo.save(
        this.syncEventRepo.create({
          installationId: installation.id,
          eventSource: SyncSource.WIX,
          eventType: `contact.${slug}`,
          entityType: EntityType.CONTACT,
          entityId: wixContactId,
          correlationId: eventId,
          payloadHash: this.hashService.hashPayload(hubspotPayload),
          status: SyncStatus.SKIPPED,
          payloadRedacted: {
            reason: 'missing_email_mapping',
          },
        }),
      );

      return { ok: true, skipped: true };
    }

    const payloadHash = this.hashService.hashPayload(hubspotPayload);

    const existingLink = await this.contactLinkRepo.findOne({
      where: {
        installationId: installation.id,
        wixContactId,
      },
    });

    if (
      existingLink &&
      existingLink.lastSource === SyncSource.WIX &&
      this.dedupeService.shouldSkip({
        previousHash: existingLink.lastPayloadHash,
        currentHash: payloadHash,
        lastUpdatedAt: existingLink.updatedAt,
      })
    ) {
      await this.syncEventRepo.save(
        this.syncEventRepo.create({
          installationId: installation.id,
          eventSource: SyncSource.WIX,
          eventType: `contact.${slug}`,
          entityType: EntityType.CONTACT,
          entityId: wixContactId,
          correlationId: eventId,
          payloadHash,
          status: SyncStatus.SKIPPED,
          payloadRedacted: {
            reason: 'dedupe',
            email: wixNormalized.email ?? null,
          },
        }),
      );

      return { ok: true, skipped: true };
    }

    const accessToken = await this.hubspotTokenService.getValidAccessToken(
      installation.id,
    );

    const hubspotContact = await this.hubspotContactsService.upsertByEmail(
      accessToken,
      email,
      hubspotPayload,
    );

    const link =
      existingLink ??
      this.contactLinkRepo.create({
        installationId: installation.id,
        wixContactId,
        hubspotContactId: hubspotContact.id,
      });

    link.hubspotContactId = hubspotContact.id;
    link.lastSource = SyncSource.WIX;
    link.lastCorrelationId = eventId;
    link.lastPayloadHash = payloadHash;
    link.lastWixUpdatedAt = new Date();

    await this.contactLinkRepo.save(link);

    await this.syncEventRepo.save(
      this.syncEventRepo.create({
        installationId: installation.id,
        eventSource: SyncSource.WIX,
        eventType: `contact.${slug}`,
        entityType: EntityType.CONTACT,
        entityId: wixContactId,
        correlationId: eventId,
        payloadHash,
        status: SyncStatus.SYNCED,
        payloadRedacted: {
          wixContactId,
          hubspotContactId: hubspotContact.id,
          email,
          hubspotPayload,
          contextApplied: this.getAppliedContextSummary(
            latestContext,
            mappings,
          ),
        },
      }),
    );

    return {
      ok: true,
      wixContactId,
      hubspotContactId: hubspotContact.id,
    };
  }

  private async getLatestContextForEmail(email: string) {
    const normalizedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return null;
    }

    return this.formContextRepo.findOne({
      where: { email: normalizedEmail },
      order: { createdAt: 'DESC' },
    });
  }

  private buildContextAwareWixSource(
    wixNormalized: WixNormalizedContact,
    latestContext: FormContextEvent | null,
    mappings: FieldMapping[],
  ): ContextAwareWixSource {
    const source: ContextAwareWixSource = {
      ...wixNormalized,
    };

    if (!latestContext) {
      return source;
    }

    const mappedContextKeys = new Set(
      mappings
        .filter((mapping) => this.isWixToHubSpotDirection(mapping.direction))
        .map((mapping) => mapping.wixFieldKey),
    );

    if (mappedContextKeys.has('utm_source') && latestContext.utmSource) {
      source.utm_source = latestContext.utmSource;
    }

    if (mappedContextKeys.has('utm_medium') && latestContext.utmMedium) {
      source.utm_medium = latestContext.utmMedium;
    }

    if (mappedContextKeys.has('utm_campaign') && latestContext.utmCampaign) {
      source.utm_campaign = latestContext.utmCampaign;
    }

    if (mappedContextKeys.has('utm_term') && latestContext.utmTerm) {
      source.utm_term = latestContext.utmTerm;
    }

    if (mappedContextKeys.has('utm_content') && latestContext.utmContent) {
      source.utm_content = latestContext.utmContent;
    }

    if (mappedContextKeys.has('page_url') && latestContext.pageUrl) {
      source.page_url = latestContext.pageUrl;
    }

    if (mappedContextKeys.has('referrer_url') && latestContext.referrer) {
      source.referrer_url = latestContext.referrer;
    }

    if (mappedContextKeys.has('submitted_at') && latestContext.submittedAt) {
      source.submitted_at = latestContext.submittedAt.toISOString();
    }

    return source;
  }

  private isWixToHubSpotDirection(direction: string) {
    return direction === 'wix_to_hubspot' || direction === 'bidirectional';
  }

  private getAppliedContextSummary(
    latestContext: FormContextEvent | null,
    mappings: FieldMapping[],
  ) {
    if (!latestContext) {
      return null;
    }

    const mappedContextKeys = new Set(
      mappings
        .filter((mapping) => this.isWixToHubSpotDirection(mapping.direction))
        .map((mapping) => mapping.wixFieldKey),
    );

    return {
      utm_source: mappedContextKeys.has('utm_source')
        ? latestContext.utmSource
        : null,
      utm_medium: mappedContextKeys.has('utm_medium')
        ? latestContext.utmMedium
        : null,
      utm_campaign: mappedContextKeys.has('utm_campaign')
        ? latestContext.utmCampaign
        : null,
      utm_term: mappedContextKeys.has('utm_term')
        ? latestContext.utmTerm
        : null,
      utm_content: mappedContextKeys.has('utm_content')
        ? latestContext.utmContent
        : null,
      page_url: mappedContextKeys.has('page_url')
        ? latestContext.pageUrl
        : null,
      referrer_url: mappedContextKeys.has('referrer_url')
        ? latestContext.referrer
        : null,
      submitted_at: mappedContextKeys.has('submitted_at')
        ? (latestContext.submittedAt?.toISOString?.() ?? null)
        : null,
    };
  }

  private normalizeWixContact(contact: any): WixNormalizedContact {
    return {
      firstName: contact?.info?.name?.first ?? '',
      lastName: contact?.info?.name?.last ?? '',
      email:
        contact?.primaryInfo?.email ??
        contact?.info?.emails?.items?.[0]?.email ??
        '',
      phone:
        contact?.primaryInfo?.phone ??
        contact?.info?.phones?.items?.[0]?.phone ??
        '',
      company: contact?.info?.company ?? '',
      jobTitle: contact?.info?.jobTitle ?? '',
    };
  }
}
