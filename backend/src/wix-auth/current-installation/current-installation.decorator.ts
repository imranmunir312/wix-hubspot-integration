import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedWixRequestContext } from '../../common/types/wix-auth';

export const CurrentInstallation = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      wixContext?: AuthenticatedWixRequestContext;
    }>();

    return request.wixContext?.installation ?? null;
  },
);
