import { expect, test as base } from '@playwright/test';
import { env } from '../config/env';
import { DemoblazeAuthModals } from '../pages/demoblaze.auth.modals';
import { DemoblazeCartPage } from '../pages/demoblaze.cart.page';
import { DemoblazeHomePage } from '../pages/demoblaze.home.page';
import { DemoblazeProductPage } from '../pages/demoblaze.product.page';
import { makeRandomUser } from '../utils/testdata';

type Fixtures = {
  homePage: DemoblazeHomePage;
  auth: DemoblazeAuthModals;
  productPage: DemoblazeProductPage;
  cartPage: DemoblazeCartPage;

  /** Ensures we have a logged-in user. Signs up a new one if env creds are missing. */
  loginOrSignup: () => Promise<{ username: string; password: string }>;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => await use(new DemoblazeHomePage(page)),
  auth: async ({ page }, use) => await use(new DemoblazeAuthModals(page)),
  productPage: async ({ page }, use) => await use(new DemoblazeProductPage(page)),
  cartPage: async ({ page }, use) => await use(new DemoblazeCartPage(page)),

  loginOrSignup: async ({ homePage, auth }, use) => {
    await use(async () => {
      await homePage.goto();
      await homePage.assertLoaded();

      // Demoblaze uses username/password (not email)
      const username = env.userEmail; // reuse env var as "username"
      const password = env.userPassword;

      if (username && password) {
        await homePage.openLogin();
        await auth.login(username, password);
        await homePage.assertLoggedIn(username);
        return { username, password };
      }

      const user = makeRandomUser();
      const uname = user.email.split('@')[0];

      await homePage.openSignup();
      await auth.signup(uname, user.password);

      // Login after signup (signup doesn't log you in)
      await homePage.openLogin();
      await auth.login(uname, user.password);
      await homePage.assertLoggedIn(uname);

      return { username: uname, password: user.password };
    });
  },
});

export { expect };
