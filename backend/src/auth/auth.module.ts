import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HubspotAuthService } from './hubspot-auth.service';
import { CryptoService } from './crypto.service';
import { WixAuthModule } from '../wix-auth/wix-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Installation]), WixAuthModule],
  controllers: [AuthController],
  providers: [AuthService, HubspotAuthService, CryptoService],
  exports: [AuthService, CryptoService, HubspotAuthService],
})
export class AuthModule {}
