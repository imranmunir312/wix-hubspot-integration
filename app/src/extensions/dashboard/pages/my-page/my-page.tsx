import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  Page,
  WixDesignSystemProvider,
  Button,
  Box,
  Text,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";

const BASE_URL = "http://localhost:4000";

type HubspotStatus = {
  installationId: string;
  status: string;
  connected: boolean;
  hubspotPortalId: string | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiresAt: string | null;
};

const DashboardPage: FC = () => {
  const [status, setStatus] = useState<HubspotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/oauth/hubspot/status`);
      const data = (await res.json()) as HubspotStatus;
      setStatus(data);
    } catch (error) {
      console.error("Failed to load HubSpot status", error);
    } finally {
      setLoading(false);
    }
  };

  const startHubspotOAuth = () => {
    window.open(
      `${BASE_URL}/api/oauth/hubspot/start`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const refreshStatus = async () => {
    await loadStatus();
  };

  const disconnectHubspot = async () => {
    try {
      await fetch(`${BASE_URL}/api/oauth/hubspot/disconnect`, {
        method: "POST",
      });
      await loadStatus();
    } catch (error) {
      console.error("Failed to disconnect HubSpot", error);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="HubSpot Integration"
          subtitle="Connect your HubSpot account from this dashboard."
        />
        <Page.Content>
          <Box direction="vertical" gap="SP4">
            <Text size="medium">
              Status:{" "}
              <strong>
                {loading
                  ? "Loading..."
                  : status?.connected
                    ? "Connected"
                    : "Disconnected"}
              </strong>
            </Text>

            {status?.hubspotPortalId && (
              <Text size="small">
                HubSpot Portal ID: {status.hubspotPortalId}
              </Text>
            )}

            {status?.connected ? (
              <Button
                priority="secondary"
                onClick={() => void disconnectHubspot()}
              >
                Disconnect HubSpot
              </Button>
            ) : (
              <>
                <Button onClick={startHubspotOAuth}>Connect HubSpot</Button>
                <Button
                  priority="secondary"
                  onClick={() => void refreshStatus()}
                >
                  Refresh Status
                </Button>
              </>
            )}
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
