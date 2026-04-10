export const SYNC_DIRECTIONS = [
  "wix_to_hubspot",
  "hubspot_to_wix",
  "bidirectional",
] as const;

export type MappingDirection = (typeof SYNC_DIRECTIONS)[number];

export const TRANSFORM_TYPES = ["none", "trim", "lowercase"] as const;

export type MappingTransformType = (typeof TRANSFORM_TYPES)[number];

export type HubspotStatus = {
  installationId: string;
  status: string;
  connected: boolean;
  hubspotPortalId: string | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiresAt: string | null;
};

export type WixFieldOption = {
  key: string;
  label: string;
};

export type HubspotPropertyOption = {
  name: string;
  label: string;
  type: string;
};

export type MappingRow = {
  wixFieldKey: string;
  hubspotPropertyName: string;
  direction: MappingDirection;
  transformType: MappingTransformType;
  defaultValue?: string;
  isEnabled?: boolean;
};

export type SaveMappingsRequest = {
  mappings: MappingRow[];
};

export type DashboardSelectOption<TValue extends string = string> = {
  id: TValue;
  value: TValue;
  label: string;
};

export type DashboardFormValues = {
  mappings: MappingRow[];
};
