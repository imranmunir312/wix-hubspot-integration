import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HubspotSignatureService } from '../hubspot-signature/hubspot-signature.service';
import { HubspotService } from '../hubspot.service';

@Controller('api/webhooks/hubspot')
export class HubspotWebhooksController {
  constructor(
    private readonly hubspotSignatureService: HubspotSignatureService,
    private readonly hubspotService: HubspotService,
  ) {}

  @Post()
  async handleWebhook(
    @Req() req: Request & { rawBody?: string },
    @Body() body: unknown,
    @Headers('x-hubspot-signature-v3') signature: string,
    @Headers('x-hubspot-request-timestamp') timestamp: string,
    @Res() res: Response,
  ) {
    const protocol =
      (req.headers['x-forwarded-proto'] as string | undefined)
        ?.split(',')[0]
        ?.trim() || req.protocol;

    const host =
      (req.headers['x-forwarded-host'] as string | undefined)
        ?.split(',')[0]
        ?.trim() || req.get('host');

    const requestUri = `${protocol}://${host}${req.originalUrl}`;
    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : JSON.stringify(body ?? '');

    this.hubspotSignatureService.verifySignatureV3({
      signature,
      method: req.method,
      requestUri,
      body: rawBody,
      timestamp,
    });

    const result = await this.hubspotService.handleWebhook({
      rawBody,
      body,
      signature,
      timestamp,
      method: req.method,
      uri: requestUri,
    });

    return res.status(200).json(result);
  }
}
