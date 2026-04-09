import { app } from '@wix/astro/builders';
import dashboardPage from './extensions/dashboard/pages/dashboard/dashboard.extension.ts';

export default app()
  .use(dashboardPage)
