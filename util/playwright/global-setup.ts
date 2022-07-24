import { chromium, FullConfig } from '@playwright/test';
import login from './playwrightLogin';

const username = process.env.TEST_USERNAME ?? '';
const password = process.env.TEST_PASSWORD ?? '';

async function globalSetup(config: FullConfig): Promise<void> {
  const { storageState } = config.projects[0].use;
  // TODO: Remove headless after this has been tested
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const baseUrl = 'http://localhost:3000/';
  await page.goto(baseUrl);
  await login(page, username, password);
  await page.context().storageState({
    path: storageState as string,
  });
  await browser.close();
}

export default globalSetup;
