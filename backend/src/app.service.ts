import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      ok: true,
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }
}
