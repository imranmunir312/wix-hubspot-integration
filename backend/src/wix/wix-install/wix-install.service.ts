import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from '../../installations/installation.entity';
import { InstallationStatus } from '../../common/enums/installation.enums';
@Injectable()
export class WixInstallService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
  ) {}

  async handleAppInstalledEvent(input: {
    instanceId: string;
    siteId?: string | null;
  }) {
    const { instanceId, siteId } = input;

    let installation = await this.installationRepo.findOne({
      where: { wixInstanceId: instanceId },
    });

    if (!installation) {
      installation = this.installationRepo.create({
        wixInstanceId: instanceId,
        wixSiteId: siteId ?? `site_${instanceId}`,
        status: InstallationStatus.DISCONNECTED,
      });
    } else if (siteId) {
      installation.wixSiteId = siteId;
    }

    await this.installationRepo.save(installation);

    return installation;
  }
}
