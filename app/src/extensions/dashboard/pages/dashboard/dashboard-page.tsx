import type { FC } from "react";
import {
  AutoComplete,
  Box,
  Button,
  Card,
  CustomModalLayout,
  Divider,
  Dropdown,
  Heading,
  Image,
  Loader,
  Modal,
  Page,
  Table,
  TableActionCell,
  Text,
  TextButton,
  WixDesignSystemProvider,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import {
  Refresh,
  Delete,
  Add,
  ArrowRight,
  ArrowLeftRight,
  ArrowLeft,
} from "@wix/wix-ui-icons-common/odeditor";
import { useDashboardController } from "./useDashboardController";
import { CircleLargeSmall } from "@wix/wix-ui-icons-common";
import { ConnectHubSpot } from "./ConnectHubSpot";
import styles from "./dashbaord.module.css";
import type { MappingRow } from "./dashboardTypes";

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

  const columns = [
    {
      title: "Wix Field",
      render: (row: MappingRow, index: number) => (
        <AutoComplete
          options={wixFieldOptions}
          value={row.wixFieldKey ?? ""}
          predicate={(option) => matchesSearch(option, row.wixFieldKey ?? "")}
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
      ),
    },
    {
      title: "",
      width: 24,
      render: (row: MappingRow) =>
        row.direction === "bidirectional" ? (
          <ArrowLeftRight />
        ) : row.direction === "wix_to_hubspot" ? (
          <ArrowRight />
        ) : (
          <ArrowLeft />
        ),
    },
    {
      title: "HubSpot Field",
      render: (row: MappingRow, index: number) => (
        <AutoComplete
          options={hubspotPropertyOptions}
          value={row.hubspotPropertyName ?? ""}
          predicate={(option) =>
            matchesSearch(option, row.hubspotPropertyName ?? "")
          }
          onChange={(event) =>
            handleHubspotPropertySearchChange(index, event.target.value)
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
      ),
    },
    {
      title: "Sync Type",
      render: (row: MappingRow, index: number) => (
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
      ),
    },
    {
      title: "Conflict Rule",
      render: (row: MappingRow, index: number) => (
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
      ),
    },
    {
      render: (row: MappingRow, index: number) => (
        <TableActionCell
          size="medium"
          secondaryActions={[
            {
              text: "Delete",
              icon: <Delete />,
              onClick: () => removeMappingRow(index),
              skin: "destructive",
            },
          ]}
          numOfVisibleSecondaryActions={1}
          moreActionsTooltipText="Delete"
          alwaysShowSecondaryActions
        />
      ),
      width: 50,
      title: "Actions",
    },
  ];

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

  if (!status?.connected) {
    return (
      <ConnectHubSpot
        refreshDashboard={refreshDashboard}
        handleConnectHubspot={handleConnectHubspot}
      />
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="HubSpot Integration"
          subtitle="Connect HubSpot and configure how your data syncs"
        />
        <Page.Content>
          <Box direction="vertical" gap={"SP4"} height={"calc(100% - 125px)"}>
            <Box direction="vertical" gap="SP4">
              {errorMessage && (
                <Card>
                  <Box padding="24px">
                    <Text skin="error">{errorMessage}</Text>
                  </Box>
                </Card>
              )}

              <Card>
                <Box
                  direction="horizontal"
                  gap="SP2"
                  padding="24px"
                  display="flex"
                  className={styles.headerDesign}
                >
                  <Box gap="SP3" justifyItems="center" placeItems="center">
                    <Box gap="SP1" justifyItems="center" placeItems="center">
                      <CircleLargeSmall
                        color="green"
                        fill="green"
                        stroke="green"
                        strokeWidth={3}
                      />
                      <Heading size="large">
                        {status?.connected ? "Connected" : "Disconnected"}
                      </Heading>
                    </Box>

                    {status?.hubspotPortalId && (
                      <>
                        <Divider direction="vertical" />
                        <Text size="small">
                          Portal ID: {status.hubspotPortalId}
                        </Text>
                      </>
                    )}
                  </Box>

                  <Box gap="SP3" justifyItems="center" placeItems="center">
                    <TextButton
                      size="medium"
                      prefixIcon={<Refresh />}
                      style={{
                        fontWeight: 500,
                      }}
                      onClick={() => void refreshDashboard()}
                    >
                      Refresh Status
                    </TextButton>
                    {status?.connected ? (
                      <Button
                        skin="destructive"
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
                  </Box>
                </Box>
              </Card>

              <Card>
                <Box direction="vertical" gap="SP3" padding="24px">
                  <Box direction="vertical">
                    <Heading size="large">Field Mapping</Heading>
                    <Text size="medium" color={"#333853"}>
                      Define how fields sync between systems
                    </Text>
                  </Box>

                  <Table
                    data={mappings}
                    columns={columns}
                    rowVerticalPadding="medium"
                  >
                    <Table.Content />
                  </Table>

                  <Box gap="SP2">
                    <TextButton
                      priority="secondary"
                      onClick={addMappingRow}
                      prefixIcon={<Add />}
                      weight="bold"
                      style={{
                        paddingLeft: 24,
                      }}
                    >
                      Add Mapping
                    </TextButton>
                  </Box>
                </Box>
              </Card>
            </Box>

            <Card>
              <Box
                direction="horizontal"
                gap="SP2"
                padding="24px"
                display="flex"
                className={styles.footerSticky}
              >
                <Text>Unsaved Changes</Text>

                <Box gap="SP3" justifyItems="center" placeItems="center">
                  <Button priority="secondary">Discard Changes</Button>
                  <Button onClick={() => void handleSaveMappings()}>
                    {saving ? "Saving..." : "Save Changes"}
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
