import { Injectable } from '@nestjs/common';
import { Client } from '@hubspot/api-client';

@Injectable()
export class HubSpotClientFactory {
  create(accessToken: string): Client {
    return new Client({ accessToken });
  }
}
