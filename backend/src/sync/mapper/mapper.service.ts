/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { SyncDirection } from '../../common/enums/mapping.enums';

@Injectable()
export class MapperService {
  mapWixToHubSpot(source: Record<string, any>, mappings: any[]) {
    const result: Record<string, any> = {};

    for (const mapping of mappings) {
      if (!mapping.isEnabled) continue;
      if (
        mapping.direction !== SyncDirection.WIX_TO_HUBSPOT &&
        mapping.direction !== SyncDirection.BIDIRECTIONAL
      ) {
        continue;
      }

      const raw = source?.[mapping.wixFieldKey];
      result[mapping.hubspotPropertyName] = this.transform(
        raw,
        mapping.transformType,
        mapping.defaultValue,
      );
    }

    return result;
  }

  mapHubSpotToWix(source: Record<string, any>, mappings: any[]) {
    const result: Record<string, any> = {};

    for (const mapping of mappings) {
      if (!mapping.isEnabled) continue;
      if (
        mapping.direction !== SyncDirection.HUBSPOT_TO_WIX &&
        mapping.direction !== SyncDirection.BIDIRECTIONAL
      ) {
        continue;
      }

      const raw = source?.[mapping.hubspotPropertyName];
      result[mapping.wixFieldKey] = this.transform(
        raw,
        mapping.transformType,
        mapping.defaultValue,
      );
    }

    return result;
  }

  private transform(value: any, transformType = 'none', defaultValue?: string) {
    const next = value ?? defaultValue ?? null;
    if (typeof next !== 'string') return next;
    if (transformType === 'trim') return next.trim();
    if (transformType === 'lowercase') return next.trim().toLowerCase();
    return next;
  }
}
