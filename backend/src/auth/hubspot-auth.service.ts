import { Injectable } from '@nestjs/common';
import { HubSpotTokenResponse } from '../common/types/hubspot-oauth.types';

interface HubSpotTokenApiResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  hub_id?: number;
}

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

  private async requestToken(
    body: URLSearchParams,
    fallbackRefreshToken?: string,
  ): Promise<HubSpotTokenResponse> {
    const response = await fetch('https://api.hubapi.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `HubSpot code exchange failed: ${response.status} ${body}`,
      );
    }

    const json = (await response.json()) as HubSpotTokenApiResponse;

    const resolvedRefreshToken = json.refresh_token ?? fallbackRefreshToken;

    if (!resolvedRefreshToken) {
      throw new Error('HubSpot token response did not include a refresh token');
    }

    return {
      accessToken: json.access_token,
      refreshToken: resolvedRefreshToken,
      expiresIn: json.expires_in,
      tokenType: json.token_type,
      hubId: json.hub_id,
    };
  }

  async exchangeCode(code: string): Promise<HubSpotTokenResponse> {
    return this.requestToken(
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code,
      }),
    );
  }

  async refreshToken(refreshToken: string): Promise<HubSpotTokenResponse> {
    if (!process.env.HUBSPOT_CLIENT_ID || !process.env.HUBSPOT_CLIENT_SECRET) {
      throw new Error('HubSpot client ID or secret not configured');
    }

    return this.requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
      refreshToken,
    );
  }
}
