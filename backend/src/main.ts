import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, NextFunction, Response, text } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const staticAssetsPath = [
    join(__dirname, 'public'),
    join(__dirname, '..', 'public'),
    join(process.cwd(), 'public'),
  ].find((candidate) => existsSync(candidate));

  app.set('etag', false);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use('/api', (_req, res: Response, next: NextFunction) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  if (staticAssetsPath) {
    app.useStaticAssets(staticAssetsPath);
  }

  app.use('/api/webhooks/wix', text({ type: '*/*' }));

  app.use(
    json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
