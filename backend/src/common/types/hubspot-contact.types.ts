export interface HubSpotContactProperties {
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  [key: string]: string | undefined;
}

export interface UpsertHubSpotContactInput {
  email: string;
  properties: HubSpotContactProperties;
}
