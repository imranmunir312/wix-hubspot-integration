import * as crypto from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from '../installations/installation.entity';
import { FieldMapping } from '../mappings/field-mappings.entity';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { CryptoService } from '../auth/crypto.service';
import { HubspotContactsService } from '../hubspot/hubspot-contacts.service';
import { MapperService } from '../sync/mapper/mapper.service';
import { HashService } from '../sync/hash/hash.service';
import { SyncSource, SyncStatus, EntityType } from '../common/enums/sync.enums';
import { HubspotTokenService } from '../hubspot/hubspot-token/hubspot-token.service';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    @InjectRepository(FieldMapping)
    private readonly mappingRepo: Repository<FieldMapping>,
    @InjectRepository(SyncEvent)
    private readonly syncEventRepo: Repository<SyncEvent>,
    private readonly cryptoService: CryptoService,
    private readonly hubspotContactsService: HubspotContactsService,
    private readonly mapperService: MapperService,
    private readonly hashService: HashService,
    private readonly hubspotTokenService: HubspotTokenService,
  ) {}

  async handleSubmission(installationId: string, payload: Record<string, any>) {
    if (!installationId) {
      throw new BadRequestException('installationId is required');
    }

    const installation = await this.installationRepo.findOne({
      where: { id: installationId },
    });

    if (!installation?.hubspotAccessTokenEnc) {
      throw new BadRequestException('HubSpot is not connected');
    }

    const mappings = await this.mappingRepo.find({
      where: { installationId, isEnabled: true },
      order: { createdAt: 'ASC' },
    });

    const accessToken =
      await this.hubspotTokenService.getValidAccessToken(installationId);

    const normalizedSubmission = this.normalizeSubmission(payload);
    const mappedProperties = this.mapperService.mapWixToHubSpot(
      normalizedSubmission,
      mappings,
    );

    const email = normalizedSubmission.email;
    if (!email) {
      throw new BadRequestException('Email is required for HubSpot upsert');
    }

    const payloadHash = this.hashService.hashPayload(mappedProperties);

    const contact = await this.hubspotContactsService.upsertByEmail(
      accessToken,
      email,
      mappedProperties,
    );

    await this.syncEventRepo.save(
      this.syncEventRepo.create({
        installationId,
        eventSource: SyncSource.WIX,
        eventType: 'form.submitted',
        entityType: EntityType.FORM_SUBMISSION,
        entityId: email,
        correlationId: crypto.randomUUID(),
        payloadHash,
        status: SyncStatus.SYNCED,
        payloadRedacted: {
          email,
          pageUrl: normalizedSubmission.pageUrl ?? null,
          referrer: normalizedSubmission.referrer ?? null,
          utm_source: normalizedSubmission.utm_source ?? null,
          utm_medium: normalizedSubmission.utm_medium ?? null,
          utm_campaign: normalizedSubmission.utm_campaign ?? null,
        },
      }),
    );

    return {
      ok: true,
      contactId: contact.id,
      email,
      mappedProperties,
    };
  }

  private normalizeSubmission(payload: Record<string, any>) {
    return {
      firstName: payload.firstName ?? payload.firstname ?? '',
      lastName: payload.lastName ?? payload.lastname ?? '',
      email: payload.email ?? '',
      phone: payload.phone ?? '',
      company: payload.company ?? '',
      jobTitle: payload.jobTitle ?? payload.jobtitle ?? '',
      utm_source: payload.utm_source ?? '',
      utm_medium: payload.utm_medium ?? '',
      utm_campaign: payload.utm_campaign ?? '',
      utm_term: payload.utm_term ?? '',
      utm_content: payload.utm_content ?? '',
      pageUrl: payload.pageUrl ?? '',
      referrer: payload.referrer ?? '',
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
  }
}
