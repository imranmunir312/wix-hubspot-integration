import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('api/oauth/hubspot')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('start')
  async start(@Res() res: Response) {
    const url = await this.authService.getStartUrl();
    return res.redirect(url);
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

  @Get('status')
  async status() {
    return this.authService.getStatus();
  }

  @Post('disconnect')
  async disconnect() {
    return this.authService.disconnect();
  }
}
