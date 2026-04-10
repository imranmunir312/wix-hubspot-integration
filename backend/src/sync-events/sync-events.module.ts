import { Module } from '@nestjs/common';
import { SyncEventsController } from './sync-events.controller';
import { SyncEventsService } from './sync-events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncEvent } from './sync-event.entity';
import { WixAuthModule } from '../wix-auth/wix-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SyncEvent]), WixAuthModule],
  controllers: [SyncEventsController],
  providers: [SyncEventsService],
})
export class SyncEventsModule {}
