import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { FieldMapping } from '../mappings/field-mappings.entity';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { HubspotModule } from '../hubspot/hubspot.module';
import { SyncModule } from '../sync/sync.module';
import { AuthModule } from '../auth/auth.module';
import { MappingsModule } from '../mappings/mappings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Installation, FieldMapping, SyncEvent]),
    HubspotModule,
    SyncModule,
    AuthModule,
    MappingsModule,
  ],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
