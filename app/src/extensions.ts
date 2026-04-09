import { app } from "@wix/astro/builders";
import dashboardPage from "./extensions/dashboard/pages/dashboard/dashboard.extension.ts";

import contactform from "./extensions/site/embedded-scripts/contactform/contactform.extension.ts";

export default app().use(dashboardPage).use(contactform);
