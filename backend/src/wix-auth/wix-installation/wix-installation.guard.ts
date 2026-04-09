import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WixRequestAuthService } from '../wix-request-auth/wix-request-auth.service';

@Injectable()
export class WixInstallationGuard implements CanActivate {
  constructor(private readonly wixRequestAuthService: WixRequestAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      wixContext?: unknown;
    }>();

    const wixContext =
      await this.wixRequestAuthService.authenticateFromAuthorizationHeader(
        request.headers.authorization,
      );

    request.wixContext = wixContext;
    return true;
  }
}
