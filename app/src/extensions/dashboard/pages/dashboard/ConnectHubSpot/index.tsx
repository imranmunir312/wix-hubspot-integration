import {
  WixDesignSystemProvider,
  Page,
  Box,
  CustomModalLayout,
  Modal,
  Text,
  Image,
  Heading,
  Button,
  TextButton,
} from "@wix/design-system";
import { Refresh } from "@wix/wix-ui-icons-common/odeditor";
import styles from "./connectHubSpot.module.css";

export interface IConnectHubSpotProps {
  handleConnectHubspot: () => {};
  refreshDashboard: () => {};
}

export const ConnectHubSpot = ({
  handleConnectHubspot,
  refreshDashboard,
}: IConnectHubSpotProps) => {
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page height="100vh">
        <Page.Content>
          <Box height="100%" width="100%" align="center" verticalAlign="middle">
            <Modal screen="desktop" isOpen>
              <CustomModalLayout
                width={640}
                footnote={
                  <Text size="small" className={styles.footerNoteCenter}>
                    Once connection is complete press refresh status
                  </Text>
                }
                footnoteClassName={styles.footerNoteCenter}
                content={
                  <Box
                    direction="vertical"
                    align="center"
                    verticalAlign="middle"
                    gap="SP6"
                    padding="60px 48px"
                    width="100%"
                  >
                    <Box
                      display="flex"
                      justifyItems="center"
                      gap={"SP2"}
                      style={{
                        alignItems: "center",
                      }}
                    >
                      <Image
                        height={100}
                        width={100}
                        src="../../../../../assets/images/wix.jpg"
                      />
                      <Image
                        height={40}
                        width={40}
                        src="../../../../../assets/images/directions.jpg"
                      />
                      <Image
                        width={100}
                        height={100}
                        src="../../../../../assets/images/hubspot.jpg"
                      />
                    </Box>
                    <Box
                      display="flex"
                      direction="vertical"
                      align="center"
                      verticalAlign="middle"
                      gap="SP4"
                      width="100%"
                    >
                      <Heading
                        size="extraLarge"
                        textAlign="center"
                        style={{
                          maxWidth: "520px",
                          margin: 0,
                        }}
                      >
                        Connect Wix with HubSpot
                      </Heading>

                      <Text
                        size="medium"
                        textAlign="center"
                        className={styles.textAlignCenter}
                        style={{
                          margin: 0,
                          textAlign: "center",
                          justifyItems: "center",
                        }}
                      >
                        Sync your contacts, forms, and customer data between Wix
                        and HubSpot automatically. Keep everything aligned
                        across your marketing and sales tools without manual
                        work.
                      </Text>
                    </Box>

                    <Box
                      direction="vertical"
                      align="center"
                      gap="SP2"
                      marginTop="SP2"
                    >
                      <Button
                        size="large"
                        style={{
                          minWidth: "240px",
                          height: "48px",
                          borderRadius: "999px",
                          fontWeight: 500,
                        }}
                        onClick={() => void handleConnectHubspot()}
                      >
                        Connect HubSpot
                      </Button>

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
                    </Box>
                  </Box>
                }
              />
            </Modal>
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};
