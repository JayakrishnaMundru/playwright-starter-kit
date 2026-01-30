import { test } from '../src/fixtures/test';

test('user can log in and see inventory (Products)', async ({ login, inventoryPage }) => {
  await login();
  await inventoryPage.assertLoaded();
});
