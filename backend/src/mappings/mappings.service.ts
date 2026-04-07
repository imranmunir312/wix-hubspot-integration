import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FieldMapping } from './field-mappings.entity';
import { Installation } from '../installations/installation.entity';
import { SaveMappingsDto } from './dto/save-mappings.dto';
import { TransformType } from '../common/enums/mapping.enums';

@Injectable()
export class MappingsService {
  constructor(
    @InjectRepository(FieldMapping)
    private readonly mappingRepo: Repository<FieldMapping>,
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
  ) {}

  async getMappings(installationId: string) {
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
    ];
  }

  getHubSpotProperties() {
    return [
      { name: 'firstname', label: 'First name', type: 'string' },
      { name: 'lastname', label: 'Last name', type: 'string' },
      { name: 'email', label: 'Email', type: 'string' },
      { name: 'phone', label: 'Phone', type: 'string' },
      { name: 'company', label: 'Company', type: 'string' },
      { name: 'jobtitle', label: 'Job title', type: 'string' },
    ];
  }

  async saveMappings(installationId: string, dto: SaveMappingsDto) {
    const installation = await this.installationRepo.findOne({
      where: { id: installationId },
    });

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    await this.mappingRepo.delete({ installationId });

    const rows = dto.mappings.map((item) =>
      this.mappingRepo.create({
        installationId,
        wixFieldKey: item.wixFieldKey,
        hubspotPropertyName: item.hubspotPropertyName,
        direction: item.direction,
        transformType: item.transformType ?? TransformType.NONE,
        defaultValue: item.defaultValue,
        isEnabled: item.isEnabled ?? true,
      }),
    );

    return this.mappingRepo.save(rows);
  }
}
