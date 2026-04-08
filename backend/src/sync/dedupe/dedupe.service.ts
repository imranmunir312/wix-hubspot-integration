import { Injectable } from '@nestjs/common';

@Injectable()
export class DedupeService {
  shouldSkip(params: {
    previousHash?: string | null;
    currentHash: string;
    lastUpdatedAt?: Date | null;
    dedupeSeconds?: number;
  }): boolean {
    const {
      previousHash,
      currentHash,
      lastUpdatedAt,
      dedupeSeconds = 60,
    } = params;

    if (!previousHash || previousHash !== currentHash || !lastUpdatedAt) {
      return false;
    }

    const diffSeconds = (Date.now() - new Date(lastUpdatedAt).getTime()) / 1000;
    return diffSeconds <= dedupeSeconds;
  }
}
