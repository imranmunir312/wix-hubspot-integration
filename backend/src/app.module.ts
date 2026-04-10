import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstallationsModule } from './installations/installations.module';
import { MappingsModule } from './mappings/mappings.module';
import { ContactLinksModule } from './contact-links/contact-links.module';
import { SyncEventsModule } from './sync-events/sync-events.module';
import { AuthModule } from './auth/auth.module';
import { HubspotModule } from './hubspot/hubspot.module';
import { SyncModule } from './sync/sync.module';
import { FormsModule } from './forms/forms.module';
import { WixModule } from './wix/wix.module';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/{*test}'],
      serveStaticOptions: {
        fallthrough: false,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
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
    SyncModule,
    FormsModule,
    WixModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
