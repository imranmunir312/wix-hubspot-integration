import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from '../../installations/installation.entity';
import {
  AuthenticatedWixRequestContext,
  WixInnerTokenPayload,
  WixOuterTokenPayload,
} from '../../common/types/wix-auth';

@Injectable()
export class WixRequestAuthService {
  constructor(
    @InjectRepository(Installation)
    private readonly installationRepo: Repository<Installation>,
  ) {}

  async authenticateFromAuthorizationHeader(
    authorization?: string,
  ): Promise<AuthenticatedWixRequestContext> {
    if (!authorization) {
      throw new UnauthorizedException('Missing Wix authorization header');
    }

    const inner = this.decodeAuthorizationToken(authorization);

    const instanceId = inner.instance?.instanceId;
    const metaSiteId = inner.instance?.metaSiteId ?? null;

    if (!instanceId) {
      throw new BadRequestException('Missing instanceId in Wix token');
    }

    const installation = await this.installationRepo.findOne({
      where: { wixInstanceId: instanceId },
    });

    if (!installation) {
      throw new UnauthorizedException(
        'Installation not found for Wix instance',
      );
    }

    return {
      instanceId,
      metaSiteId,
      installation,
    };
  }

  private decodeAuthorizationToken(
    authorization: string,
  ): WixInnerTokenPayload {
    const token = authorization.trim();

    const prefix = 'OauthNG.JWS.';
    if (!token.startsWith(prefix)) {
      throw new BadRequestException('Invalid Wix authorization token format');
    }

    const jwt = token.slice(prefix.length);
    const parts = jwt.split('.');

    if (parts.length !== 3) {
      throw new BadRequestException('Invalid Wix JWT structure');
    }

    let outerPayload: WixOuterTokenPayload;

    try {
      outerPayload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      ) as WixOuterTokenPayload;
    } catch {
      throw new BadRequestException('Failed to decode Wix JWT payload');
    }

    if (!outerPayload.data) {
      throw new BadRequestException('Missing data field in Wix token payload');
    }

    try {
      return JSON.parse(outerPayload.data) as WixInnerTokenPayload;
    } catch {
      throw new BadRequestException('Failed to parse Wix token data payload');
    }
  }
}
