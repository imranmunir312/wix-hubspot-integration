import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { WixRequestAuthService } from './wix-request-auth/wix-request-auth.service';
import { WixInstallationGuard } from './wix-installation/wix-installation.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Installation])],
  providers: [WixRequestAuthService, WixInstallationGuard],
  exports: [WixRequestAuthService, WixInstallationGuard],
})
export class WixAuthModule {}
