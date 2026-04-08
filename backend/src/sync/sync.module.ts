import { Module } from '@nestjs/common';
import { MapperService } from './mapper/mapper.service';
import { DedupeService } from './dedupe/dedupe.service';
import { HashService } from './hash/hash.service';

@Module({
  providers: [MapperService, DedupeService, HashService],
  exports: [MapperService, DedupeService, HashService],
})
export class SyncModule {}
