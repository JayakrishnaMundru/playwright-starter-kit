import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DemoblazeProductPage extends BasePage {
  private addToCartLink = this.page.getByRole('link', { name: /add to cart/i });
  private title = this.page.locator('.name');

  async assertLoaded() {
    await expect(this.title).toBeVisible();
    await expect(this.addToCartLink).toBeVisible();
  }

  async addToCart() {
    await this.assertLoaded();
    await this.addToCartLink.click();

    // Confirm via alert
    const dialog = await this.page.waitForEvent('dialog', { timeout: 15000 });
    const msg = dialog.message();
    await dialog.accept();
    if (!/product added/i.test(msg)) {
      throw new Error(`Unexpected add-to-cart alert: ${msg}`);
    }
  }
}
