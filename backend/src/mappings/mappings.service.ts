import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FieldMapping } from './field-mappings.entity';
import { Installation } from '../installations/installation.entity';
import { SaveMappingsDto } from './dto/save-mappings.dto';
import { SyncDirection, TransformType } from '../common/enums/mapping.enums';
import { CryptoService } from '../auth/crypto.service';
import { HubspotPropertiesService } from '../hubspot/hubspot-properties.service';
import { HubspotTokenService } from '../hubspot/hubspot-token/hubspot-token.service';

@Injectable()
export class MappingsService {
  constructor(
    @InjectRepository(FieldMapping)
    private readonly mappingRepo: Repository<FieldMapping>,
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    private readonly cryptoService: CryptoService,
    private readonly hubspotPropertiesService: HubspotPropertiesService,
    private readonly hubspotTokenService: HubspotTokenService,
  ) {}

  async getMappings(installationId: string) {
    if (!installationId) {
      throw new BadRequestException('installationId is required');
    }

    return this.mappingRepo.find({
      where: { installationId },
      order: { createdAt: 'ASC' },
    });
  }

  getWixFields() {
    return [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'utm_source', label: 'UTM Source' },
      { key: 'utm_medium', label: 'UTM Medium' },
      { key: 'utm_campaign', label: 'UTM Campaign' },
      { key: 'utm_term', label: 'UTM Term' },
      { key: 'utm_content', label: 'UTM Content' },
      { key: 'pageUrl', label: 'Page URL' },
      { key: 'referrer', label: 'Referrer' },
      { key: 'timestamp', label: 'Submission Timestamp' },
    ];
  }

  async getHubSpotProperties(installationId?: string) {
    if (!installationId) {
      return [];
    }

    const installation = await this.installationRepo.findOne({
      where: { id: installationId },
    });

    if (!installation?.hubspotAccessTokenEnc) {
      return [];
    }

    const accessToken =
      await this.hubspotTokenService.getValidAccessToken(installationId);
    return this.hubspotPropertiesService.getContactProperties(accessToken);
  }

  async saveMappings(installationId: string, dto: SaveMappingsDto) {
    if (!installationId) {
      throw new BadRequestException('installationId is required');
    }

    const installation = await this.installationRepo.findOne({
      where: { id: installationId },
    });

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    const hubspotPropertyNames = dto.mappings.map((m) => m.hubspotPropertyName);
    const duplicates = hubspotPropertyNames.filter(
      (item, index) => hubspotPropertyNames.indexOf(item) !== index,
    );

    if (duplicates.length > 0) {
      throw new BadRequestException(
        `Duplicate HubSpot property mapping found: ${duplicates[0]}`,
      );
    }

    await this.mappingRepo.delete({ installationId });

    const rows = dto.mappings.map((item) =>
      this.mappingRepo.create({
        installationId,
        wixFieldKey: item.wixFieldKey,
        hubspotPropertyName: item.hubspotPropertyName,
        direction: item.direction ?? SyncDirection.BIDIRECTIONAL,
        transformType: item.transformType ?? TransformType.NONE,
        defaultValue: item.defaultValue,
        isEnabled: item.isEnabled ?? true,
      }),
    );

    return this.mappingRepo.save(rows);
  }
}
