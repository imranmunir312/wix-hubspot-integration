/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HashService {
  hashPayload(payload: Record<string, any>): string {
    const normalized = JSON.stringify(this.sortKeys(payload));
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  private sortKeys(value: any): any {
    if (Array.isArray(value)) return value.map((v) => this.sortKeys(v));
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = this.sortKeys(value[key]);
            return acc;
          },
          {} as Record<string, any>,
        );
    }
    return value;
  }
}
