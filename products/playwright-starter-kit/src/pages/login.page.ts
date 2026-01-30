import { expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Backwards-compatible name: this now models Magento Luma login via the Sign In page.
 * Use MagentoHomePage.openSignIn() to navigate.
 */
export class LoginPage extends BasePage {
  private email = this.page.getByLabel(/email/i);
  private password = this.page.getByLabel(/^password$/i);
  private signInBtn = this.page.getByRole('button', { name: /^sign in$/i });

  async assertLoaded() {
    // Customer Login heading is a stable indicator
    await expect(this.page.getByRole('heading', { name: /customer login/i })).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.assertLoaded();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.signInBtn.click();
    await expect(this.page).toHaveURL(/customer\/account/);
  }
}
