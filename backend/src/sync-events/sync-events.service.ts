import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncEvent } from './sync-event.entity';
import { Installation } from '../installations/installation.entity';

@Injectable()
export class SyncEventsService {
  constructor(
    @InjectRepository(SyncEvent)
    private readonly syncEventRepository: Repository<SyncEvent>,
  ) {}

  async getEvents(installation: Installation): Promise<SyncEvent[]> {
    const results = await this.syncEventRepository.find({
      where: {
        installationId: installation.id,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return results ?? [];
  }
}
