import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from './installation.entity';
import { InstallationStatus } from '../common/enums/installation.enums';

@Injectable()
export class InstallationsService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
  ) {}

  async findAll() {
    return this.installationRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByWixInstanceId(wixInstanceId: string) {
    return this.installationRepo.findOne({
      where: { wixInstanceId },
    });
  }

  async createDemoInstallation() {
    const existing = await this.installationRepo.findOne({
      where: { wixInstanceId: 'demo-instance' },
    });

    if (existing) return existing;

    const installation = this.installationRepo.create({
      wixSiteId: 'demo-site',
      wixInstanceId: 'demo-instance',
      status: InstallationStatus.DISCONNECTED,
    });

    return this.installationRepo.save(installation);
  }
}
