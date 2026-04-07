import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstallationsModule } from './installations/installations.module';
import { MappingsModule } from './mappings/mappings.module';
import { ContactLinksModule } from './contact-links/contact-links.module';
import { SyncEventsModule } from './sync-events/sync-events.module';
import { AuthModule } from './auth/auth.module';
import { HubspotModule } from './hubspot/hubspot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    InstallationsModule,
    MappingsModule,
    ContactLinksModule,
    SyncEventsModule,
    AuthModule,
    HubspotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
