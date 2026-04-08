import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Installation } from '../installations/installation.entity';
import { FieldMapping } from '../mappings/field-mappings.entity';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { HubspotTokenService } from './hubspot-token/hubspot-token.service';
import { HubspotContactsService } from './hubspot-contacts.service';
import { HubspotSignatureService } from './hubspot-signature/hubspot-signature.service';
import { MapperService } from '../sync/mapper/mapper.service';
import { HashService } from '../sync/hash/hash.service';
import { SyncSource, SyncStatus, EntityType } from '../common/enums/sync.enums';
import { ContactLink } from '../contact-links/contact-link.entity';
import { WixContactsService } from '../wix/wix-contacts/wix-contacts.service';
import { DedupeService } from '../sync/dedupe/dedupe.service';

type HubspotWebhookSkippedResult = {
  installationId: string;
  hubspotContactId: string;
  skipped: true;
};

type HubspotWebhookSyncedResult = {
  installationId: string;
  hubspotContactId: string;
  skipped: false;
  wixPayload: Record<string, any>;
  wixContactId: string;
};

type HubspotWebhookResult =
  | HubspotWebhookSkippedResult
  | HubspotWebhookSyncedResult;

@Injectable()
export class HubspotService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    @InjectRepository(FieldMapping)
    private readonly mappingRepo: Repository<FieldMapping>,
    @InjectRepository(SyncEvent)
    private readonly syncEventRepo: Repository<SyncEvent>,
    @InjectRepository(ContactLink)
    private readonly contactLinkRepo: Repository<ContactLink>,
    private readonly hubspotTokenService: HubspotTokenService,
    private readonly hubspotContactsService: HubspotContactsService,
    private readonly hubspotSignatureService: HubspotSignatureService,
    private readonly mapperService: MapperService,
    private readonly hashService: HashService,
    private readonly dedupeService: DedupeService,
    private readonly wixContactsService: WixContactsService,
  ) {}

  async handleWebhook(input: {
    rawBody: string;
    body: any;
    signature: string;
    timestamp: string;
    method: string;
    uri: string;
  }) {
    this.hubspotSignatureService.verifySignatureV3({
      signature: input.signature,
      timestamp: input.timestamp,
      method: input.method,
      uri: input.uri,
      body: input.rawBody,
    });

    const events = Array.isArray(input.body) ? input.body : [input.body];

    const results: HubspotWebhookResult[] = [];

    for (const event of events) {
      const result = await this.handleSingleEvent(event);
      results.push(result);
    }

    return {
      ok: true,
      processed: results.length,
      results,
    };
  }

  private async handleSingleEvent(event: any): Promise<HubspotWebhookResult> {
    const correlationId = crypto.randomUUID();

    const hubspotPortalId = event.portalId ? String(event.portalId) : null;
    const hubspotContactId = event.objectId ? String(event.objectId) : null;

    if (!hubspotPortalId || !hubspotContactId) {
      throw new BadRequestException('Invalid HubSpot webhook event');
    }

    const installation = await this.installationRepo.findOne({
      where: { hubspotPortalId },
    });

    if (!installation) {
      throw new BadRequestException('No installation found for HubSpot portal');
    }

    const accessToken = await this.hubspotTokenService.getValidAccessToken(
      installation.id,
    );

    const hubspotContact = await this.hubspotContactsService.getById(
      accessToken,
      hubspotContactId,
    );

    const mappings = await this.mappingRepo.find({
      where: { installationId: installation.id, isEnabled: true },
      order: { createdAt: 'ASC' },
    });

    const wixPayload = this.mapperService.mapHubSpotToWix(
      hubspotContact.properties ?? {},
      mappings,
    );

    if (!wixPayload || Object.keys(wixPayload).length === 0) {
      await this.syncEventRepo.save(
        this.syncEventRepo.create({
          installationId: installation.id,
          eventSource: SyncSource.HUBSPOT,
          eventType: event.subscriptionType ?? 'contact.propertyChange',
          entityType: EntityType.CONTACT,
          entityId: hubspotContactId,
          correlationId,
          status: SyncStatus.SKIPPED,
          payloadRedacted: {
            reason: 'empty_mapped_payload',
            email: hubspotContact.properties?.email ?? null,
          },
        }),
      );

      return {
        installationId: installation.id,
        hubspotContactId,
        skipped: true,
      };
    }

    const payloadHash = this.hashService.hashPayload(wixPayload);

    const existingLink = await this.contactLinkRepo.findOne({
      where: {
        installationId: installation.id,
        hubspotContactId,
      },
    });

    if (
      existingLink &&
      existingLink.lastSource === SyncSource.HUBSPOT &&
      this.dedupeService.shouldSkip({
        previousHash: existingLink.lastPayloadHash,
        currentHash: payloadHash,
        lastUpdatedAt: existingLink.updatedAt,
      })
    ) {
      await this.syncEventRepo.save(
        this.syncEventRepo.create({
          installationId: installation.id,
          eventSource: SyncSource.HUBSPOT,
          eventType: event.subscriptionType ?? 'contact.propertyChange',
          entityType: EntityType.CONTACT,
          entityId: hubspotContactId,
          correlationId,
          payloadHash,
          status: SyncStatus.SKIPPED,
          payloadRedacted: {
            reason: 'dedupe',
            email: hubspotContact.properties?.email ?? null,
          },
        }),
      );

      return {
        installationId: installation.id,
        hubspotContactId,
        skipped: true,
      };
    }

    let wixContactId = existingLink?.wixContactId ?? null;

    if (!wixContactId) {
      const email = hubspotContact.properties?.email ?? null;

      let wixContact = email
        ? await this.wixContactsService.findByEmail(installation, email)
        : null;

      if (!wixContact) {
        wixContact = await this.wixContactsService.createContact(
          installation,
          wixPayload,
        );
      } else {
        wixContact = await this.wixContactsService.updateContact(
          installation,
          wixContact.id,
          wixPayload,
        );
      }

      wixContactId = wixContact.id;
    } else {
      await this.wixContactsService.updateContact(
        installation,
        wixContactId,
        wixPayload,
      );
    }

    const link =
      existingLink ??
      this.contactLinkRepo.create({
        installationId: installation.id,
        hubspotContactId,
        wixContactId,
      });

    link.lastSource = SyncSource.HUBSPOT;
    link.lastCorrelationId = correlationId;
    link.lastPayloadHash = payloadHash;
    link.lastHubspotUpdatedAt = new Date();

    await this.contactLinkRepo.save(link);

    await this.syncEventRepo.save(
      this.syncEventRepo.create({
        installationId: installation.id,
        eventSource: SyncSource.HUBSPOT,
        eventType: event.subscriptionType ?? 'contact.propertyChange',
        entityType: EntityType.CONTACT,
        entityId: hubspotContactId,
        correlationId,
        payloadHash,
        status: SyncStatus.SYNCED,
        payloadRedacted: {
          hubspotContactId,
          wixContactId,
          email: hubspotContact.properties?.email ?? null,
          wixPayload,
        },
      }),
    );

    return {
      installationId: installation.id,
      hubspotContactId,
      skipped: false,
      wixContactId,
      wixPayload,
    };
  }
}
