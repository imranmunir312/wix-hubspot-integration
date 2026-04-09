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
import {
  EntityType,
  SyncSource,
  SyncStatus,
} from '../../common/enums/sync.enums';

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
    const hubspotPayload = this.mapperService.mapWixToHubSpot(
      wixNormalized,
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
        },
      }),
    );

    return {
      ok: true,
      wixContactId,
      hubspotContactId: hubspotContact.id,
    };
  }

  private normalizeWixContact(contact: any) {
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
