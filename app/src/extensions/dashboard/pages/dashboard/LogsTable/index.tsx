import {
  Box,
  CustomModalLayout,
  Loader,
  Modal,
  Text,
  Table,
} from "@wix/design-system";
import type { Logs } from "../dashboardTypes";

export interface ILogsTableProps {
  isViewLogs: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
  handleCloseLogs: () => void;
  logs: Logs[];
}

export const LogsTable = ({
  isViewLogs,
  isLoading,
  errorMessage,
  handleCloseLogs,
  logs,
}: ILogsTableProps) => {
  const columns = [
    { title: "Log Id", render: (row: Logs) => row.id },
    { title: "Entity Id", render: (row: Logs) => row.entityId },
    { title: "Entity Type", render: (row: Logs) => row.entityType },
    { title: "Event Source", render: (row: Logs) => row.eventSource },
    { title: "Event Type", render: (row: Logs) => row.eventType, width: 200 },
    { title: "Status", render: (row: Logs) => row.status },
    {
      title: "Created At",
      render: (row: Logs) => (
        <Text size="tiny">{new Date(row.createdAt).toISOString()}</Text>
      ),
    },
  ];

  return (
    <Modal isOpen={isViewLogs} screen="desktop">
      <CustomModalLayout
        onCloseButtonClick={handleCloseLogs}
        title="Logs"
        removeContentPadding
        width="min(1200px, 90vw)"
        maxHeight="800px"
      >
        {isLoading ? (
          <Box
            height={"100%"}
            minHeight="320px"
            align="center"
            verticalAlign="middle"
            direction="vertical"
          >
            <Loader />
          </Box>
        ) : errorMessage ? (
          <Box
            minHeight="320px"
            align="center"
            verticalAlign="middle"
            direction="vertical"
            padding="24px"
          >
            <Text skin="error">{errorMessage}</Text>
          </Box>
        ) : logs.length === 0 ? (
          <Box
            minHeight="320px"
            align="center"
            verticalAlign="middle"
            direction="vertical"
            padding="24px"
          >
            <Text>No logs found.</Text>
          </Box>
        ) : (
          <Table
            data={logs}
            columns={columns}
            rowVerticalPadding="small"
            width={"100%"}
          >
            <Table.Content />
          </Table>
        )}
      </CustomModalLayout>
    </Modal>
  );
};
