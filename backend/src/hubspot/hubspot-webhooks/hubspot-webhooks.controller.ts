import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { HubspotService } from '../hubspot.service';

@Controller('api/webhooks/hubspot')
export class HubspotWebhooksController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Post()
  async handleWebhook(
    @Req() req: any,
    @Body() body: any,
    @Headers('x-hubspot-signature-v3') signature: string,
    @Headers('x-hubspot-request-timestamp') timestamp: string,
  ) {
    return this.hubspotService.handleWebhook({
      rawBody: req.rawBody ?? JSON.stringify(body),
      body,
      signature,
      timestamp,
      method: req.method,
      uri: req.originalUrl,
    });
  }
}
