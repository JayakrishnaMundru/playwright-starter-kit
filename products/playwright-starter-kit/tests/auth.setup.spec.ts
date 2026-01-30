import { test } from '@playwright/test';
import { env } from '../src/config/env';
import { LoginPage } from '../src/pages/login.page';

/**
 * Optional: generate storageState.json for authenticated tests.
 */
test('auth setup (storageState)', async ({ page }) => {
  await page.goto(env.baseUrl);
  const login = new LoginPage(page);
  await login.login(env.userEmail, env.userPassword);
  await page.context().storageState({ path: 'storageState.json' });
});
