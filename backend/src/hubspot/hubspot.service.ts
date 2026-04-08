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

type HubspotWebhookResult = {
  installationId: string;
  hubspotContactId: string;
  wixPayload: Record<string, any>;
};

@Injectable()
export class HubspotService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    @InjectRepository(FieldMapping)
    private readonly mappingRepo: Repository<FieldMapping>,
    @InjectRepository(SyncEvent)
    private readonly syncEventRepo: Repository<SyncEvent>,
    private readonly hubspotTokenService: HubspotTokenService,
    private readonly hubspotContactsService: HubspotContactsService,
    private readonly hubspotSignatureService: HubspotSignatureService,
    private readonly mapperService: MapperService,
    private readonly hashService: HashService,
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

    const payloadHash = this.hashService.hashPayload(wixPayload);

    await this.syncEventRepo.save(
      this.syncEventRepo.create({
        installationId: installation.id,
        eventSource: SyncSource.HUBSPOT,
        eventType: event.subscriptionType ?? 'contact.propertyChange',
        entityType: EntityType.CONTACT,
        entityId: hubspotContactId,
        correlationId: crypto.randomUUID(),
        payloadHash,
        status: SyncStatus.RECEIVED,
        payloadRedacted: {
          hubspotContactId,
          email: hubspotContact.properties?.email ?? null,
          wixPayload,
        },
      }),
    );

    return {
      installationId: installation.id,
      hubspotContactId,
      wixPayload,
    };
  }
}
