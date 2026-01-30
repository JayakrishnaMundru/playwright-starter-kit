import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutInfoPage extends BasePage {
  private title = this.page.getByText('Checkout: Your Information', { exact: true });
  private firstName = this.page.locator('[data-test="firstName"]');
  private lastName = this.page.locator('[data-test="lastName"]');
  private zip = this.page.locator('[data-test="postalCode"]');
  private continueBtn = this.page.getByRole('button', { name: /continue/i });

  async assertLoaded() {
    await expect(this.title).toBeVisible();
  }

  async fillAndContinue(data: { firstName: string; lastName: string; postalCode: string }) {
    await this.assertLoaded();
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.zip.fill(data.postalCode);
    await this.continueBtn.click();
  }
}
