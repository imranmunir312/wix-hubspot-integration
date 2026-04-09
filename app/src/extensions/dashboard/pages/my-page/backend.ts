import { wixClient } from "./wixClient";

const BASE_URL = "http://localhost:4000";

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
  direction: "wix_to_hubspot" | "hubspot_to_wix" | "bidirectional";
  transformType: "none" | "trim" | "lowercase";
  defaultValue?: string;
  isEnabled?: boolean;
};

async function authFetch(path: string, init?: RequestInit) {
  return wixClient.fetchWithAuth(`${BASE_URL}${path}`, init);
}

export async function getHubspotStatus(): Promise<HubspotStatus> {
  const res = await authFetch("/api/oauth/hubspot/status");
  if (!res.ok) throw new Error("Failed to fetch HubSpot status");
  return res.json() as Promise<HubspotStatus>;
}

export async function getWixFields(): Promise<WixFieldOption[]> {
  const res = await authFetch("/api/mappings/options/wix-fields");
  if (!res.ok) throw new Error("Failed to fetch Wix fields");
  return res.json() as Promise<WixFieldOption[]>;
}

export async function getHubspotProperties(): Promise<HubspotPropertyOption[]> {
  const res = await authFetch("/api/mappings/options/hubspot-properties");
  if (!res.ok) throw new Error("Failed to fetch HubSpot properties");
  return res.json() as Promise<HubspotPropertyOption[]>;
}

export async function getMappings() {
  const res = await authFetch("/api/mappings");
  if (!res.ok) throw new Error("Failed to fetch mappings");
  return res.json();
}

export async function saveMappings(mappings: MappingRow[]) {
  const res = await authFetch("/api/mappings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mappings }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to save mappings");
  }

  return res.json();
}

export async function disconnectHubspot() {
  const res = await authFetch("/api/oauth/hubspot/disconnect", {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to disconnect HubSpot");
  }
}

export async function startHubspotOAuth() {
  const res = await authFetch("/api/oauth/hubspot/authorize-url");
  if (!res.ok) throw new Error("Failed to prepare HubSpot OAuth");

  const data = (await res.json()) as { url: string };
  window.open(data.url, "_blank", "noopener,noreferrer");
}
