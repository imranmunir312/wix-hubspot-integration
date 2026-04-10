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
import { LogsTable } from "./LogsTable";

const DashboardPage: FC = () => {
  const {
    addMappingRow,
    directionOptions,
    discardChanges,
    errorMessage,
    getFieldError,
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
    isDirty,
    loading,
    mappings,
    mappingsError,
    matchesSearch,
    refreshDashboard,
    removeMappingRow,
    saving,
    status,
    transformOptions,
    wixFieldOptions,
    wixFieldSearchValues,
    isViewLogs,
    isLogsLoading,
    logsErrorMessage,
    handleCloseViewLogsModal,
    handleOpenViewLogsModal,
    logs,
  } = useDashboardController();

  const columns = [
    {
      title: "Wix Field",
      render: (row: MappingRow, index: number) => (
        <Box direction="vertical" gap="SP1">
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
          {getFieldError(index, "wixFieldKey") && (
            <Text size="small" skin="error">
              {getFieldError(index, "wixFieldKey")}
            </Text>
          )}
        </Box>
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
        <Box direction="vertical" gap="SP1">
          <AutoComplete
            options={hubspotPropertyOptions}
            value={hubspotPropertySearchValues[index] ?? ""}
            predicate={(option) =>
              matchesSearch(option, hubspotPropertySearchValues[index] ?? "")
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
          {getFieldError(index, "hubspotPropertyName") && (
            <Text size="small" skin="error">
              {getFieldError(index, "hubspotPropertyName")}
            </Text>
          )}
        </Box>
      ),
    },
    {
      title: "Sync Type",
      render: (row: MappingRow, index: number) => (
        <Box direction="vertical" gap="SP1">
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
          {getFieldError(index, "direction") && (
            <Text size="small" skin="error">
              {getFieldError(index, "direction")}
            </Text>
          )}
        </Box>
      ),
    },
    {
      title: "Transform",
      render: (row: MappingRow, index: number) => (
        <Box direction="vertical" gap="SP1">
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
          {getFieldError(index, "transformType") && (
            <Text size="small" skin="error">
              {getFieldError(index, "transformType")}
            </Text>
          )}
        </Box>
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
                  <Box gap="SP1" className={styles.viewLogs}>
                    <Box direction="vertical">
                      <Heading size="large">Field Mapping</Heading>
                      <Text size="medium" color={"#333853"}>
                        Define how fields sync between systems
                      </Text>
                    </Box>
                    <Button
                      skin="dark"
                      priority="secondary"
                      onClick={handleOpenViewLogsModal}
                    >
                      View Logs
                    </Button>
                  </Box>

                  <Table
                    data={mappings}
                    columns={columns}
                    rowVerticalPadding="medium"
                  >
                    <Table.Content />
                  </Table>

                  {mappingsError && (
                    <Text size="small" skin="error">
                      {mappingsError}
                    </Text>
                  )}

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
                <Text>{isDirty ? "Unsaved Changes" : "All changes saved"}</Text>

                <Box gap="SP3" justifyItems="center" placeItems="center">
                  <Button
                    priority="secondary"
                    disabled={!isDirty || saving}
                    onClick={discardChanges}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    disabled={!isDirty || saving}
                    onClick={() => void handleSaveMappings()}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </Box>
            </Card>
          </Box>
        </Page.Content>
      </Page>
      <LogsTable
        isViewLogs={isViewLogs}
        isLoading={isLogsLoading}
        errorMessage={logsErrorMessage}
        handleCloseLogs={handleCloseViewLogsModal}
        logs={logs}
      />
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
