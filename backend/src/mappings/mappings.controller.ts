import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MappingsService } from './mappings.service';
import { SaveMappingsDto } from './dto/save-mappings.dto';
import { WixInstallationGuard } from '../wix-auth/wix-installation/wix-installation.guard';
import { CurrentInstallation } from '../wix-auth/current-installation/current-installation.decorator';
import { Installation } from '../installations/installation.entity';

@Controller('api/mappings')
@UseGuards(WixInstallationGuard)
export class MappingsController {
  constructor(private readonly mappingsService: MappingsService) {}

  @Get('options/wix-fields')
  getWixFields() {
    return this.mappingsService.getWixFields();
  }

  @Get('options/hubspot-properties')
  async getHubSpotProperties(
    @CurrentInstallation() installation: Installation,
  ) {
    return this.mappingsService.getHubSpotProperties(installation.id);
  }

  @Get()
  async getMappings(@CurrentInstallation() installation: Installation) {
    return this.mappingsService.getMappings(installation.id);
  }

  @Post()
  async saveMappings(
    @CurrentInstallation() installation: Installation,
    @Body() dto: SaveMappingsDto,
  ) {
    return this.mappingsService.saveMappings(installation.id, dto);
  }
}
