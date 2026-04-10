import type {
  HubspotPropertyOption,
  HubspotStatus,
  MappingRow,
  SaveMappingsRequest,
  WixFieldOption,
} from "./dashboardTypes";
import { wixClient } from "./wixClient";

const BASE_URL = import.meta.env.PUBLIC_BACKEND_BASE_URL;

export const useDashboardApi = () => {
  const authFetch = async (path: string, init?: RequestInit) =>
    wixClient.fetchWithAuth(`${BASE_URL}${path}`, init);

  const getHubspotStatus = async (): Promise<HubspotStatus> => {
    const response = await authFetch("/api/oauth/hubspot/status");

    if (!response.ok) {
      throw new Error("Failed to fetch HubSpot status");
    }

    return response.json() as Promise<HubspotStatus>;
  };

  const getWixFields = async (): Promise<WixFieldOption[]> => {
    const response = await authFetch("/api/mappings/options/wix-fields");

    if (!response.ok) {
      throw new Error("Failed to fetch Wix fields");
    }

    return response.json() as Promise<WixFieldOption[]>;
  };

  const getHubspotProperties = async (): Promise<HubspotPropertyOption[]> => {
    const response = await authFetch(
      "/api/mappings/options/hubspot-properties",
    );

    if (!response.ok) {
      throw new Error("Failed to fetch HubSpot properties");
    }

    return response.json() as Promise<HubspotPropertyOption[]>;
  };

  const getMappings = async (): Promise<Array<Partial<MappingRow>>> => {
    const response = await authFetch("/api/mappings");

    if (!response.ok) {
      throw new Error("Failed to fetch mappings");
    }

    return response.json() as Promise<Array<Partial<MappingRow>>>;
  };

  const saveMappings = async (payload: SaveMappingsRequest) => {
    const response = await authFetch("/api/mappings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to save mappings");
    }

    return response.json();
  };

  const disconnectHubspot = async () => {
    const response = await authFetch("/api/oauth/hubspot/disconnect", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to disconnect HubSpot");
    }
  };

  const getHubspotAuthorizeUrl = async () => {
    const response = await authFetch("/api/oauth/hubspot/authorize-url");

    if (!response.ok) {
      throw new Error("Failed to prepare HubSpot OAuth");
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  };

  const getEventSyncLogs = async () => {
    const response = await authFetch("/api/sync-events");

    if (!response.ok) {
      throw new Error("Failed to fetch logs");
    }

    const data = await response.json();
    return data;
  };

  return {
    disconnectHubspot,
    getHubspotAuthorizeUrl,
    getHubspotProperties,
    getHubspotStatus,
    getMappings,
    getWixFields,
    saveMappings,
    getEventSyncLogs,
  };
};
