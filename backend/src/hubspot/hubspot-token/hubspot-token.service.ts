import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from '../../installations/installation.entity';
import { CryptoService } from '../../auth/crypto.service';
import { HubspotAuthService } from '../../auth/hubspot-auth.service';

@Injectable()
export class HubspotTokenService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    private readonly cryptoService: CryptoService,
    private readonly hubspotAuthService: HubspotAuthService,
  ) {}

  async getValidAccessToken(installationId: string): Promise<string> {
    const installation = await this.installationRepo.findOne({
      where: { id: installationId },
    });

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    if (
      !installation.hubspotAccessTokenEnc ||
      !installation.hubspotRefreshTokenEnc
    ) {
      throw new BadRequestException('HubSpot is not connected');
    }

    const now = Date.now();
    const expiresAt = installation.hubspotTokenExpiresAt?.getTime() ?? 0;

    // refresh 2 minutes before expiry
    const shouldRefresh = !expiresAt || expiresAt - now < 2 * 60 * 1000;

    if (!shouldRefresh) {
      return this.cryptoService.decrypt(installation.hubspotAccessTokenEnc);
    }

    const refreshToken = this.cryptoService.decrypt(
      installation.hubspotRefreshTokenEnc,
    );
    const refreshed = await this.hubspotAuthService.refreshToken(refreshToken);

    installation.hubspotAccessTokenEnc = this.cryptoService.encrypt(
      refreshed.accessToken,
    );
    installation.hubspotRefreshTokenEnc = this.cryptoService.encrypt(
      refreshed.refreshToken,
    );
    installation.hubspotTokenExpiresAt = new Date(
      Date.now() + refreshed.expiresIn * 1000,
    );

    if (refreshed.hubId) {
      installation.hubspotPortalId = String(refreshed.hubId);
    }

    await this.installationRepo.save(installation);

    return refreshed.accessToken;
  }
}
