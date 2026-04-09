import { createClient } from "@wix/sdk";
import { dashboard } from "@wix/dashboard";

export const wixClient = createClient({
  host: dashboard.host(),
  auth: dashboard.auth(),
  modules: { dashboard },
});
