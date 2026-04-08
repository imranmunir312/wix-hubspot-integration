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
import { WixSignatureService } from '../wix-signature/wix-signature.service';
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
    private readonly wixSignatureService: WixSignatureService,
    private readonly hubspotTokenService: HubspotTokenService,
    private readonly hubspotContactsService: HubspotContactsService,
    private readonly mapperService: MapperService,
    private readonly hashService: HashService,
    private readonly dedupeService: DedupeService,
  ) {}

  async handleContactEvent(input: {
    body: any;
    authorization?: string;
    expectedSlug: 'created' | 'updated';
  }) {
    const decoded = this.wixSignatureService.verifyAndDecodeJwt(
      input.authorization,
    );

    const event = decoded.data?.event;
    const wixContactId = event?.entityId;
    const slug = event?.slug;
    const eventId = event?.id ?? crypto.randomUUID();
    const instanceId = decoded.instanceId;

    if (!wixContactId || slug !== input.expectedSlug || !instanceId) {
      throw new BadRequestException('Invalid Wix contact event payload');
    }

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

    const email = wixNormalized.email;
    if (!email) {
      throw new BadRequestException(
        'Wix contact email is required for HubSpot upsert',
      );
    }

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
