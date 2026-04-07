export interface HubSpotTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
  hubId?: number;
}

export interface HubSpotOAuthState {
  installationId: string;
  nonce: string;
}
