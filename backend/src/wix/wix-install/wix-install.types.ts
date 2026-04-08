export interface WixAppInstalledInput {
  body: unknown;
  authorization?: string;
}

export interface WixAppInstalledResponse {
  ok: true;
  installationId: string;
  wixInstanceId: string;
  wixSiteId: string;
}
