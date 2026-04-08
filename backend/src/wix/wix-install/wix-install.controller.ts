import { Body, Controller, Post } from '@nestjs/common';
import { WixInstallService } from './wix-install.service';

@Controller('api/webhooks/wix')
export class WixInstallController {
  constructor(private readonly wixInstallService: WixInstallService) {}

  @Post('app-installed')
  async appInstalled(@Body() jwtBody: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return await this.wixInstallService.handleAppInstalled({
      jwtBody,
    });
  }
}
