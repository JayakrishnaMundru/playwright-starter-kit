import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MagentoCartPage extends BasePage {
  private heading = this.page.getByRole('heading', { name: /shopping cart/i });

  cartItemByName(name: string) {
    return this.page.locator('.cart.item').filter({ has: this.page.getByRole('link', { name }) });
  }

  async assertLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async assertHasItem(name: string) {
    await expect(this.cartItemByName(name)).toBeVisible();
  }
}
