import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from '../installations/installation.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HubspotAuthService } from './hubspot-auth.service';
import { CryptoService } from './crypto.service';

@Module({
  imports: [TypeOrmModule.forFeature([Installation])],
  controllers: [AuthController],
  providers: [AuthService, HubspotAuthService, CryptoService],
  exports: [AuthService],
})
export class AuthModule {}
