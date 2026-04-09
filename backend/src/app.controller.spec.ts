import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getHealth: jest.fn().mockReturnValue({
      ok: true,
      service: 'backend',
      timestamp: '2026-04-09T00:00:00.000Z',
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return the health payload from AppService', () => {
      expect(appController.getHealth()).toEqual({
        ok: true,
        service: 'backend',
        timestamp: '2026-04-09T00:00:00.000Z',
      });
    });
  });
});
