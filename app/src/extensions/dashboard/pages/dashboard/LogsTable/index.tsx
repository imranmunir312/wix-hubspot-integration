import { Box, CustomModalLayout, Modal, Text, Table } from "@wix/design-system";
import type { Logs } from "../dashboardTypes";
import styles from "./logsTable.module.css";

export interface ILogsTableProps {
  isViewLogs: boolean;
  handleCloseLogs: () => void;
  logs: Logs[];
}

export const LogsTable = ({
  isViewLogs,
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
    <Modal isOpen={isViewLogs}>
      <Box maxHeight={800} minHeight={800} className={styles.tableWidthLogs}>
        <CustomModalLayout
          onCloseButtonClick={handleCloseLogs}
          title="Logs"
          removeContentPadding
          className={styles.tableWidthLogs}
        >
          <Table
            data={logs}
            columns={columns}
            rowVerticalPadding="small"
            width={"100%"}
          >
            <Table.Content />
          </Table>
        </CustomModalLayout>
      </Box>
    </Modal>
  );
};
