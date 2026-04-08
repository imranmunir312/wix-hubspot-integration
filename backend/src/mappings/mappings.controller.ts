import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MappingsService } from './mappings.service';
import { SaveMappingsDto } from './dto/save-mappings.dto';

@Controller('api/mappings')
export class MappingsController {
  constructor(private readonly mappingsService: MappingsService) {}

  @Get('options/wix-fields')
  getWixFields() {
    return this.mappingsService.getWixFields();
  }

  @Get('options/hubspot-properties')
  async getHubSpotProperties(@Query('installationId') installationId: string) {
    return this.mappingsService.getHubSpotProperties(installationId);
  }

  @Get()
  async getMappings(@Query('installationId') installationId: string) {
    return this.mappingsService.getMappings(installationId);
  }

  @Post()
  async saveMappings(
    @Query('installationId') installationId: string,
    @Body() dto: SaveMappingsDto,
  ) {
    return this.mappingsService.saveMappings(installationId, dto);
  }
}
