import { test, expect } from '../src/fixtures/test';

/**
 * Single e2e flow (ecommerce): login → add item → cart → checkout → order complete.
 * Site under test: https://www.saucedemo.com/
 */

test('user can checkout a single item', async ({
  login,
  inventoryPage,
  cartPage,
  checkoutInfoPage,
  checkoutOverviewPage,
  checkoutCompletePage,
  page,
}) => {
  const itemName = 'Sauce Labs Backpack';

  await login();
  await inventoryPage.assertLoaded();

  await inventoryPage.addItemToCart(itemName);
  await inventoryPage.goToCart();

  await expect(page).toHaveURL(/cart\.html/);
  await cartPage.assertLoaded();
  await cartPage.assertHasItem(itemName);
  await cartPage.checkout();

  await expect(page).toHaveURL(/checkout-step-one\.html/);
  await checkoutInfoPage.fillAndContinue({
    firstName: 'JK',
    lastName: 'Automation',
    postalCode: '75001',
  });

  await expect(page).toHaveURL(/checkout-step-two\.html/);
  await checkoutOverviewPage.assertLoaded();
  await checkoutOverviewPage.assertHasItem(itemName);
  await checkoutOverviewPage.finish();

  await expect(page).toHaveURL(/checkout-complete\.html/);
  await checkoutCompletePage.assertLoaded();
});
