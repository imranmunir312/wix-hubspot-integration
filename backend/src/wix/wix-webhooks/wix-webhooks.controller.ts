import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { WixWebhookClientService } from '../wix-webhook-client/wix-webhook-client.service';
import { WixWebhookHandlersService } from '../wix-webhook-handlers/wix-webhook-handlers.service';

@Controller('api/webhooks/wix')
export class WixWebhooksController {
  constructor(
    private readonly wixWebhookClientService: WixWebhookClientService,
    private readonly wixWebhookHandlersService: WixWebhookHandlersService,
  ) {
    this.wixWebhookHandlersService.initialize();
  }

  @Post()
  async processWebhook(@Body() rawBody: string, @Res() res: Response) {
    try {
      const client = this.wixWebhookClientService.getClient();
      await client.webhooks.process(rawBody);
      return res.status(200).send();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Wix webhook error';
      return res.status(500).send(`Webhook error: ${message}`);
    }
  }
}
