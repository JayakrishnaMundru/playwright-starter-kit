import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MagentoProductPage extends BasePage {
  private addToCartBtn = this.page.getByRole('button', { name: /add to cart/i });
  private successMsg = this.page.locator('.message-success');
  private cartLink = this.page.getByRole('link', { name: /my cart/i });

  async assertLoaded() {
    await expect(this.addToCartBtn).toBeVisible();
  }

  async addToCart() {
    await this.assertLoaded();
    await this.addToCartBtn.click();
    await expect(this.successMsg).toBeVisible();
  }

  async goToCart() {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/checkout\/cart/);
  }
}
