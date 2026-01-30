import { expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Demo POM for https://the-internet.herokuapp.com/login
 * Replace selectors to match your app.
 */
export class LoginPage extends BasePage {
  private username = this.page.getByLabel(/username/i);
  private password = this.page.getByLabel(/password/i);
  private submit = this.page.getByRole('button', { name: /login/i });

  async assertLoaded() {
    await expect(this.submit).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.assertLoaded();
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
