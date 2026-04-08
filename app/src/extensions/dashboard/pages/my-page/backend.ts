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

export async function getHubspotStatus(): Promise<HubspotStatus> {
  const res = await fetch(`${BASE_URL}/api/oauth/hubspot/status`);
  if (!res.ok) {
    throw new Error("Failed to fetch HubSpot status");
  }
  return res.json() as Promise<HubspotStatus>;
}

export async function getWixFields(): Promise<WixFieldOption[]> {
  const res = await fetch(`${BASE_URL}/api/mappings/options/wix-fields`);
  if (!res.ok) {
    throw new Error("Failed to fetch Wix fields");
  }
  return res.json() as Promise<WixFieldOption[]>;
}

export async function getHubspotProperties(
  installationId: string,
): Promise<HubspotPropertyOption[]> {
  const res = await fetch(
    `${BASE_URL}/api/mappings/options/hubspot-properties?installationId=${encodeURIComponent(
      installationId,
    )}`,
  );
  if (!res.ok) {
    throw new Error("Failed to fetch HubSpot properties");
  }
  return res.json() as Promise<HubspotPropertyOption[]>;
}

export async function getMappings(installationId: string) {
  const res = await fetch(
    `${BASE_URL}/api/mappings?installationId=${encodeURIComponent(installationId)}`,
  );
  if (!res.ok) {
    throw new Error("Failed to fetch mappings");
  }
  return res.json();
}

export async function saveMappings(
  installationId: string,
  mappings: MappingRow[],
) {
  const res = await fetch(
    `${BASE_URL}/api/mappings?installationId=${encodeURIComponent(installationId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mappings }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to save mappings");
  }

  return res.json();
}

export function startHubspotOAuth() {
  window.open(
    `${BASE_URL}/api/oauth/hubspot/start`,
    "_blank",
    "noopener,noreferrer",
  );
}

export async function disconnectHubspot() {
  const res = await fetch(`${BASE_URL}/api/oauth/hubspot/disconnect`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to disconnect HubSpot");
  }
}
