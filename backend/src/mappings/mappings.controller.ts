import { Body, Controller, Get, Post } from '@nestjs/common';
import { MappingsService } from './mappings.service';
import { SaveMappingsDto } from './dto/save-mappings.dto';

@Controller('api/mappings')
export class MappingsController {
  constructor(private readonly mappingsService: MappingsService) {}

  private readonly demoInstallationId = 'replace-me-later';

  @Get('options/wix-fields')
  getWixFields() {
    return this.mappingsService.getWixFields();
  }

  @Get('options/hubspot-properties')
  getHubSpotProperties() {
    return this.mappingsService.getHubSpotProperties();
  }

  @Get()
  async getMappings() {
    return await Promise.resolve([]);
  }

  @Post()
  async saveMappings(@Body() dto: SaveMappingsDto) {
    return Promise.resolve({
      message: 'Step 2 placeholder. Real installation-aware save comes next.',
      received: dto,
    });
  }
}
