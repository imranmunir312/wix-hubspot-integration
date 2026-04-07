/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Installation } from '../installations/installation.entity';
import { InstallationStatus } from '../common/enums/installation.enums';
import { HubspotAuthService } from './hubspot-auth.service';
import { CryptoService } from './crypto.service';
import { HubSpotOAuthState } from '../common/types/hubspot-oauth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
    private readonly hubspotAuthService: HubspotAuthService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getStartUrl() {
    const installation = await this.ensureDemoInstallation();

    const statePayload: HubSpotOAuthState = {
      installationId: installation.id,
      nonce: crypto.randomUUID(),
    };

    const state = Buffer.from(JSON.stringify(statePayload)).toString(
      'base64url',
    );

    return this.hubspotAuthService.getAuthorizeUrl(state);
  }

  async handleCallback(code: string, state: string) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    const parsedState = this.parseState(state);

    const installation = await this.installationRepo.findOne({
      where: { id: parsedState.installationId },
    });

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    const tokenData = await this.hubspotAuthService.exchangeCode(code);

    installation.hubspotAccessTokenEnc = this.cryptoService.encrypt(
      tokenData.accessToken,
    );
    installation.hubspotRefreshTokenEnc = this.cryptoService.encrypt(
      tokenData.refreshToken,
    );
    installation.hubspotTokenExpiresAt = new Date(
      Date.now() + tokenData.expiresIn * 1000,
    );
    installation.hubspotPortalId = tokenData.hubId
      ? String(tokenData.hubId)
      : null;

    await this.installationRepo.save(installation);

    return installation;
  }

  async getStatus() {
    const installation = await this.ensureDemoInstallation();

    return {
      installationId: installation.id,
      status: installation.status,
      connected: installation.status === InstallationStatus.CONNECTED,
      hubspotPortalId: installation.hubspotPortalId,
      hasAccessToken: Boolean(installation.hubspotAccessTokenEnc),
      hasRefreshToken: Boolean(installation.hubspotRefreshTokenEnc),
      tokenExpiresAt: installation.hubspotTokenExpiresAt,
    };
  }

  async disconnect() {
    const installation = await this.ensureDemoInstallation();

    installation.hubspotAccessTokenEnc = null;
    installation.hubspotRefreshTokenEnc = null;
    installation.hubspotTokenExpiresAt = null;
    installation.hubspotPortalId = null;
    installation.status = InstallationStatus.DISCONNECTED;

    await this.installationRepo.save(installation);

    return { ok: true };
  }

  private parseState(state: string): HubSpotOAuthState {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      return JSON.parse(decoded) as HubSpotOAuthState;
    } catch {
      throw new BadRequestException('Invalid state');
    }
  }

  private async ensureDemoInstallation() {
    let installation = await this.installationRepo.findOne({
      where: { wixInstanceId: 'demo-instance' },
    });

    if (!installation) {
      installation = this.installationRepo.create({
        wixSiteId: 'demo-site',
        wixInstanceId: 'demo-instance',
        status: InstallationStatus.DISCONNECTED,
      });

      installation = await this.installationRepo.save(installation);
    }

    return installation;
  }
}
