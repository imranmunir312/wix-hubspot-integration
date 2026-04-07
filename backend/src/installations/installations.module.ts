import { Module } from '@nestjs/common';
import { InstallationsService } from './installations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from './installation.entity';
import { InstallationsController } from './installations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Installation])],
  providers: [InstallationsService],
  controllers: [InstallationsController],
})
export class InstallationsModule {}
