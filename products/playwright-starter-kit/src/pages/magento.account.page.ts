import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MagentoAccountPage extends BasePage {
  private accountHeader = this.page.getByRole('heading', { name: /my account/i });
  private customerMenuToggle = this.page.locator('button.action.switch');
  private signOutLink = this.page.getByRole('link', { name: /sign out/i });

  async assertLoaded() {
    await expect(this.accountHeader).toBeVisible();
  }

  async signOut() {
    // Open customer dropdown and sign out.
    await this.customerMenuToggle.first().click();
    await this.signOutLink.click();
    await expect(this.page).toHaveURL(/customer\/account\/logoutSuccess/);
  }
}
