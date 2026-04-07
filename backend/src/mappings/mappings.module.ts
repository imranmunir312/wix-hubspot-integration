import { Module } from '@nestjs/common';
import { MappingsService } from './mappings.service';
import { MappingsController } from './mappings.controller';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { ContactLink } from '../contact-links/contact-link.entity';
import { FieldMapping } from './field-mappings.entity';
import { Installation } from '../installations/installation.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Installation,
      FieldMapping,
      ContactLink,
      SyncEvent,
    ]),
  ],
  providers: [MappingsService],
  controllers: [MappingsController],
})
export class MappingsModule {}
