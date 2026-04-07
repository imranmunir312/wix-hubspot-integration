import { Injectable } from '@nestjs/common';
import { Client } from '@hubspot/api-client';
import { HubSpotTokenResponse } from '../common/types/hubspot-oauth.types';

@Injectable()
export class HubspotAuthService {
  getAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
      scope: process.env.HUBSPOT_SCOPES!,
      state,
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<HubSpotTokenResponse> {
    const response = await fetch('https://api.hubapi.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `HubSpot code exchange failed: ${response.status} ${body}`,
      );
    }

    const json = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type?: string;
      hub_id?: number;
    };

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresIn: json.expires_in,
      tokenType: json.token_type,
      hubId: json.hub_id,
    };
  }

  async refreshToken(refreshToken: string): Promise<HubSpotTokenResponse> {
    const client = new Client();

    if (!process.env.HUBSPOT_CLIENT_ID || !process.env.HUBSPOT_CLIENT_SECRET) {
      throw new Error('HubSpot client ID or secret not configured');
    }

    const result = await client.oauth.tokensApi.create(
      'refresh_token',
      undefined,
      undefined,
      process.env.HUBSPOT_CLIENT_ID,
      process.env.HUBSPOT_CLIENT_SECRET,
      refreshToken,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? refreshToken,
      expiresIn: result.expiresIn,
      tokenType: result.tokenType,
      hubId: result.idToken as number | undefined,
    };
  }
}
