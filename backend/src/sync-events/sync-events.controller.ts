import { Controller, Get, UseGuards } from '@nestjs/common';
import { WixInstallationGuard } from '../wix-auth/wix-installation/wix-installation.guard';
import { CurrentInstallation } from '../wix-auth/current-installation/current-installation.decorator';
import { Installation } from '../installations/installation.entity';
import { SyncEventsService } from './sync-events.service';
import { SyncEvent } from './sync-event.entity';

@Controller('/api/sync-events')
@UseGuards(WixInstallationGuard)
export class SyncEventsController {
  constructor(private readonly syncEventService: SyncEventsService) {}

  @Get()
  async getSyncEvents(
    @CurrentInstallation() installation: Installation,
  ): Promise<SyncEvent[]> {
    return await this.syncEventService.getEvents(installation);
  }
}
