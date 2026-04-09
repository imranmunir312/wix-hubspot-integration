import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Installation } from './installation.entity';
import { Repository } from 'typeorm';

type WixTokenPayload = {
  instanceId?: string;
  siteId?: string;
  site?: {
    id?: string;
  };
};

@Injectable()
export class InstallationsService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
  ) {}

  async resolveFromWixToken(authorization: string) {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const decoded = this.decodeJwtPayload<WixTokenPayload>(token);

    const instanceId = decoded.instanceId;
    if (!instanceId) {
      throw new BadRequestException('Missing instanceId in Wix token');
    }

    const installation = await this.installationRepo.findOne({
      where: { wixInstanceId: instanceId },
    });

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    return {
      installationId: installation.id,
      wixInstanceId: installation.wixInstanceId,
      wixSiteId: installation.wixSiteId,
      status: installation.status,
      hubspotPortalId: installation.hubspotPortalId,
    };
  }

  private decodeJwtPayload<T>(token: string): T {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new BadRequestException('Invalid Wix token format');
    }

    try {
      return JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      ) as T;
    } catch {
      throw new BadRequestException('Failed to decode Wix token');
    }
  }
}
