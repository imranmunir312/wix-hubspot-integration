import { Body, Controller, Headers, Post } from '@nestjs/common';
import { WixWebhooksService } from './wix-webhooks.service';

@Controller('api/webhooks/wix')
export class WixWebhooksController {
  constructor(private readonly wixWebhooksService: WixWebhooksService) {}

  @Post('contact-created')
  async contactCreated(
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    return this.wixWebhooksService.handleContactEvent({
      body,
      authorization,
      expectedSlug: 'created',
    });
  }

  @Post('contact-updated')
  async contactUpdated(
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    return this.wixWebhooksService.handleContactEvent({
      body,
      authorization,
      expectedSlug: 'updated',
    });
  }
}
