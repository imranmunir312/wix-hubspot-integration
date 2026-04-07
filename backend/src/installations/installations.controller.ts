import { Controller, Get, Post } from '@nestjs/common';
import { InstallationsService } from './installations.service';

@Controller('api/installations')
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @Get()
  getAll() {
    return this.installationsService.findAll();
  }

  @Get('me')
  async getMe() {
    return this.installationsService.createDemoInstallation();
  }

  @Post('seed')
  seed() {
    return this.installationsService.createDemoInstallation();
  }
}
