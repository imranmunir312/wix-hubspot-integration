import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  Page,
  WixDesignSystemProvider,
  Button,
  Box,
  Text,
  Card,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import {
  disconnectHubspot,
  getHubspotProperties,
  getHubspotStatus,
  getMappings,
  getWixFields,
  saveMappings,
  startHubspotOAuth,
  type HubspotPropertyOption,
  type HubspotStatus,
  type MappingRow,
  type WixFieldOption,
} from "./backend";

const DashboardPage: FC = () => {
  const [status, setStatus] = useState<HubspotStatus | null>(null);
  const [wixFields, setWixFields] = useState<WixFieldOption[]>([]);
  const [hubspotProperties, setHubspotProperties] = useState<
    HubspotPropertyOption[]
  >([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const statusData = await getHubspotStatus();
      setStatus(statusData);

      const wixFieldData = await getWixFields();
      setWixFields(wixFieldData);

      if (statusData.installationId) {
        const hubspotPropertyData = await getHubspotProperties(
          statusData.installationId,
        );
        setHubspotProperties(hubspotPropertyData);

        const existingMappings = await getMappings(statusData.installationId);
        setMappings(
          existingMappings.length > 0
            ? existingMappings.map((m: any) => ({
                wixFieldKey: m.wixFieldKey,
                hubspotPropertyName: m.hubspotPropertyName,
                direction: m.direction,
                transformType: m.transformType,
                defaultValue: m.defaultValue ?? "",
                isEnabled: m.isEnabled,
              }))
            : [
                {
                  wixFieldKey: "",
                  hubspotPropertyName: "",
                  direction: "bidirectional",
                  transformType: "none",
                  defaultValue: "",
                  isEnabled: true,
                },
              ],
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const updateRow = <K extends keyof MappingRow>(
    index: number,
    key: K,
    value: MappingRow[K],
  ) => {
    setMappings((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => {
    setMappings((prev) => [
      ...prev,
      {
        wixFieldKey: "",
        hubspotPropertyName: "",
        direction: "bidirectional",
        transformType: "none",
        defaultValue: "",
        isEnabled: true,
      },
    ]);
  };

  const removeRow = (index: number) => {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!status?.installationId) return;

    const cleaned = mappings.filter(
      (row) => row.wixFieldKey && row.hubspotPropertyName,
    );

    setSaving(true);
    try {
      await saveMappings(status.installationId, cleaned);
      await loadAll();
      alert("Mappings saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to save mappings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="HubSpot Integration"
          subtitle="Connect HubSpot and configure field mappings."
        />
        <Page.Content>
          <Box direction="vertical" gap="SP4">
            <Card>
              <Box direction="vertical" gap="SP2" padding="24px">
                <Text>
                  Status:{" "}
                  <strong>
                    {status?.connected ? "Connected" : "Disconnected"}
                  </strong>
                </Text>

                {status?.hubspotPortalId && (
                  <Text size="small">Portal ID: {status.hubspotPortalId}</Text>
                )}

                <Box gap="SP2">
                  {status?.connected ? (
                    <Button
                      priority="secondary"
                      onClick={() => void disconnectHubspot().then(loadAll)}
                    >
                      Disconnect HubSpot
                    </Button>
                  ) : (
                    <Button onClick={startHubspotOAuth}>Connect HubSpot</Button>
                  )}

                  <Button priority="secondary" onClick={() => void loadAll()}>
                    Refresh Status
                  </Button>
                </Box>
              </Box>
            </Card>

            <Card>
              <Box direction="vertical" gap="SP3" padding="24px">
                <Text weight="bold">Field Mapping</Text>

                {mappings.map((row, index) => (
                  <Box key={index} gap="SP2" verticalAlign="middle">
                    <select
                      value={row.wixFieldKey}
                      onChange={(e) =>
                        updateRow(index, "wixFieldKey", e.target.value)
                      }
                    >
                      <option value="">Select Wix field</option>
                      {wixFields.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={row.hubspotPropertyName}
                      onChange={(e) =>
                        updateRow(index, "hubspotPropertyName", e.target.value)
                      }
                    >
                      <option value="">Select HubSpot property</option>
                      {hubspotProperties.map((property) => (
                        <option key={property.name} value={property.name}>
                          {property.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={row.direction}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "direction",
                          e.target.value as MappingRow["direction"],
                        )
                      }
                    >
                      <option value="wix_to_hubspot">Wix → HubSpot</option>
                      <option value="hubspot_to_wix">HubSpot → Wix</option>
                      <option value="bidirectional">Bi-directional</option>
                    </select>

                    <select
                      value={row.transformType}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "transformType",
                          e.target.value as MappingRow["transformType"],
                        )
                      }
                    >
                      <option value="none">None</option>
                      <option value="trim">Trim</option>
                      <option value="lowercase">Lowercase</option>
                    </select>

                    <Button
                      priority="secondary"
                      onClick={() => removeRow(index)}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}

                <Box gap="SP2">
                  <Button priority="secondary" onClick={addRow}>
                    Add Mapping
                  </Button>

                  <Button onClick={() => void handleSave()} disabled={saving}>
                    {saving ? "Saving..." : "Save Mappings"}
                  </Button>
                </Box>
              </Box>
            </Card>
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
