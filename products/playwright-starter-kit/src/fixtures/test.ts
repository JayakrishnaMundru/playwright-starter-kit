import { expect, test as base } from '@playwright/test';
import { env } from '../config/env';
import { CartPage } from '../pages/cart.page';
import { CheckoutCompletePage } from '../pages/checkout-complete.page';
import { CheckoutInfoPage } from '../pages/checkout-info.page';
import { CheckoutOverviewPage } from '../pages/checkout-overview.page';
import { InventoryPage } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  login: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => await use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => await use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => await use(new CartPage(page)),
  checkoutInfoPage: async ({ page }, use) => await use(new CheckoutInfoPage(page)),
  checkoutOverviewPage: async ({ page }, use) => await use(new CheckoutOverviewPage(page)),
  checkoutCompletePage: async ({ page }, use) => await use(new CheckoutCompletePage(page)),

  login: async ({ page, loginPage }, use) => {
    await use(async () => {
      await page.goto(env.baseUrl);
      await loginPage.login(env.userEmail, env.userPassword);
    });
  },
});

export { expect };
