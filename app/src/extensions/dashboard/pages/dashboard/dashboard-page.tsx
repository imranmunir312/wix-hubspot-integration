import type { FC } from "react";
import {
  AutoComplete,
  Box,
  Button,
  Card,
  Dropdown,
  Loader,
  Page,
  Text,
  WixDesignSystemProvider,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { useDashboardController } from "./useDashboardController";

const normalizeSearchValue = (value: unknown) =>
  value?.toString().trim().toLowerCase() ?? "";

const matchesSearch = (
  option: { label?: unknown; value?: unknown },
  searchValue: string,
) => {
  const normalizedSearchValue = normalizeSearchValue(searchValue);

  if (!normalizedSearchValue) {
    return true;
  }

  return [option.label, option.value].some((field) =>
    normalizeSearchValue(field).includes(normalizedSearchValue),
  );
};

const DashboardPage: FC = () => {
  const {
    addMappingRow,
    directionOptions,
    errorMessage,
    handleConnectHubspot,
    handleDirectionSelect,
    handleDisconnectHubspot,
    handleHubspotPropertySearchChange,
    handleHubspotPropertySelect,
    handleSaveMappings,
    handleTransformTypeSelect,
    handleWixFieldSearchChange,
    handleWixFieldSelect,
    hubspotPropertyOptions,
    hubspotPropertySearchValues,
    loading,
    mappings,
    refreshDashboard,
    removeMappingRow,
    saving,
    status,
    transformOptions,
    wixFieldOptions,
    wixFieldSearchValues,
  } = useDashboardController();

  if (loading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Page.Content>
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader />
            </div>
          </Page.Content>
        </Page>
      </WixDesignSystemProvider>
    );
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
            {errorMessage && (
              <Card>
                <Box padding="24px">
                  <Text skin="error">{errorMessage}</Text>
                </Box>
              </Card>
            )}

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
                      onClick={() => void handleDisconnectHubspot()}
                    >
                      Disconnect HubSpot
                    </Button>
                  ) : (
                    <Button onClick={() => void handleConnectHubspot()}>
                      Connect HubSpot
                    </Button>
                  )}

                  <Button
                    priority="secondary"
                    onClick={() => void refreshDashboard()}
                  >
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
                    <AutoComplete
                      options={wixFieldOptions}
                      value={wixFieldSearchValues[index] ?? ""}
                      predicate={(option) =>
                        matchesSearch(option, wixFieldSearchValues[index] ?? "")
                      }
                      onChange={(event) =>
                        handleWixFieldSearchChange(index, event.target.value)
                      }
                      onSelect={(option) => {
                        const selectedValue = option.value?.toString();

                        if (!selectedValue) {
                          return;
                        }

                        handleWixFieldSelect(
                          index,
                          selectedValue,
                          option.label?.toString() ?? selectedValue,
                        );
                      }}
                      emptyStateMessage="No Wix fields found"
                      highlight
                      placeholder="Select Wix field"
                    />

                    <AutoComplete
                      options={hubspotPropertyOptions}
                      value={hubspotPropertySearchValues[index] ?? ""}
                      predicate={(option) =>
                        matchesSearch(
                          option,
                          hubspotPropertySearchValues[index] ?? "",
                        )
                      }
                      onChange={(event) =>
                        handleHubspotPropertySearchChange(
                          index,
                          event.target.value,
                        )
                      }
                      onSelect={(option) => {
                        const selectedValue = option.value?.toString();

                        if (!selectedValue) {
                          return;
                        }

                        handleHubspotPropertySelect(
                          index,
                          selectedValue,
                          option.label?.toString() ?? selectedValue,
                        );
                      }}
                      emptyStateMessage="No HubSpot properties found"
                      highlight
                      placeholder="Select HubSpot property"
                    />

                    <Dropdown
                      options={directionOptions}
                      selectedId={row.direction}
                      onSelect={(option) =>
                        handleDirectionSelect(
                          index,
                          option.value as (typeof row)["direction"],
                        )
                      }
                      placeholder="Direction of syncing"
                    />

                    <Dropdown
                      options={transformOptions}
                      selectedId={row.transformType}
                      onSelect={(option) =>
                        handleTransformTypeSelect(
                          index,
                          option.value as (typeof row)["transformType"],
                        )
                      }
                      placeholder="Data transformation"
                    />

                    <Button
                      priority="secondary"
                      onClick={() => removeMappingRow(index)}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}

                <Box gap="SP2">
                  <Button priority="secondary" onClick={addMappingRow}>
                    Add Mapping
                  </Button>

                  <Button
                    onClick={() => void handleSaveMappings()}
                    disabled={saving}
                  >
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
