import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private title = this.page.getByText('Your Cart', { exact: true });
  private checkoutBtn = this.page.getByRole('button', { name: /checkout/i });

  cartItemByName(itemName: string) {
    return this.page.locator('.cart_item').filter({ has: this.page.getByRole('link', { name: itemName }) });
  }

  async assertLoaded() {
    await expect(this.title).toBeVisible();
  }

  async assertHasItem(itemName: string) {
    await expect(this.cartItemByName(itemName)).toBeVisible();
  }

  async checkout() {
    await this.checkoutBtn.click();
  }
}
