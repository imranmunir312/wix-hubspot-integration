import { BadRequestException, Controller, Get, Headers } from '@nestjs/common';
import { InstallationsService } from './installations.service';

@Controller('api/installations')
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @Get('resolve')
  async resolve(@Headers('authorization') authorization?: string) {
    if (!authorization) {
      throw new BadRequestException('Missing authorization header');
    }

    return this.installationsService.resolveFromWixToken(authorization);
  }
}
