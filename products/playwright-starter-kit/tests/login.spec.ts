import { test } from '../src/fixtures/test';

test('user can log in and see secure area', async ({ login, dashboardPage }) => {
  await login();
  await dashboardPage.assertLoaded();
});
