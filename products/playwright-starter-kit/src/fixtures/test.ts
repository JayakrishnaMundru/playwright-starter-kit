import { expect, test as base } from '@playwright/test';
import { env } from '../config/env';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  login: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => await use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => await use(new DashboardPage(page)),

  login: async ({ page, loginPage }, use) => {
    await use(async () => {
      await page.goto(env.baseUrl);
      await loginPage.login(env.userEmail, env.userPassword);
    });
  },
});

export { expect };
