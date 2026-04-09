import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Installation } from '../../installations/installation.entity';
import { InstallationStatus } from '../../common/enums/installation.enums';
import { WixSdkClientService } from '../wix-sdk-client/wix-sdk-client.service';
@Injectable()
export class WixInstallService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    private readonly wixSdkClientService: WixSdkClientService,
    private readonly configService: ConfigService,
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

    const client = this.wixSdkClientService.getClient(installation);

    await client?.embeddedScripts.embedScript({
      parameters: {
        backend_script_url: this.configService.get<string>(
          'PUBLIC_BACKEND_SCRIPT_URL',
        )!,
      },
    });

    console.log('App installed event handled for instance:', instanceId);

    return installation;
  }
}
