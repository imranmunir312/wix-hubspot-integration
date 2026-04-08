import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from '../../installations/installation.entity';
import { InstallationStatus } from '../../common/enums/installation.enums';
import { WixSignatureService } from '../wix-signature/wix-signature.service';

@Injectable()
export class WixInstallService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    private readonly wixSignatureService: WixSignatureService,
  ) {}

  async handleAppInstalled(input: { jwtBody: string }) {
    const decoded = this.wixSignatureService.verifyAndDecodeJwt(input.jwtBody);

    const instanceId = decoded.instanceId;
    const siteId = decoded.siteId ?? decoded.site?.id ?? null;

    if (!instanceId) {
      throw new BadRequestException(
        'Missing instanceId in Wix install webhook',
      );
    }

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

    return {
      ok: true,
      installationId: installation.id,
      wixInstanceId: installation.wixInstanceId,
      wixSiteId: installation.wixSiteId,
    };
  }
}
