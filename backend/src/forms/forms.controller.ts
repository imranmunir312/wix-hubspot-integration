import { Body, Controller, Post, Query } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post('submit')
  async submitForm(
    @Query('installationId') installationId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.formsService.handleSubmission(installationId, body);
  }
}
