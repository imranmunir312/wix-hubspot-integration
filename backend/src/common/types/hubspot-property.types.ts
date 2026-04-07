export interface HubSpotPropertyOption {
  label: string;
  value: string;
  description?: string;
  displayOrder?: number;
  hidden?: boolean;
}

export interface HubSpotPropertySummary {
  name: string;
  label: string;
  type?: string;
  fieldType?: string;
  groupName?: string;
}
