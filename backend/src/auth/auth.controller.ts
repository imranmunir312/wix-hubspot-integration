import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { WixInstallationGuard } from '../wix-auth/wix-installation/wix-installation.guard';
import { CurrentInstallation } from '../wix-auth/current-installation/current-installation.decorator';
import { Installation } from '../installations/installation.entity';

@Controller('api/oauth/hubspot')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('start')
  @UseGuards(WixInstallationGuard)
  async start(
    @CurrentInstallation() installation: Installation,
    @Res() res: Response,
  ) {
    const url = await this.authService.getStartUrl(installation.id);
    return res.redirect(url);
  }

  @Get('status')
  @UseGuards(WixInstallationGuard)
  async status(@CurrentInstallation() installation: Installation) {
    return this.authService.getStatus(installation.id);
  }

  @Post('disconnect')
  @UseGuards(WixInstallationGuard)
  async disconnect(@CurrentInstallation() installation: Installation) {
    return this.authService.disconnect(installation.id);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.authService.handleCallback(code, state);
    return res.send(`
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h2>HubSpot connected successfully</h2>
          <p>You can close this tab and return to your Wix dashboard.</p>
        </body>
      </html>
    `);
  }

  @Get('authorize-url')
  @UseGuards(WixInstallationGuard)
  async authorizeUrl(@CurrentInstallation() installation: Installation) {
    return {
      url: await this.authService.getStartUrl(installation.id),
    };
  }
}
