import { Body, Controller, Post } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post('context')
  async captureContext(@Body() body: Record<string, unknown>) {
    return this.formsService.captureContext(body);
  }
}
