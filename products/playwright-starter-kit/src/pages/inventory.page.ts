import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  private title = this.page.getByText('Products', { exact: true });
  private cartLink = this.page.locator('a.shopping_cart_link');

  itemAddToCartButton(itemName: string) {
    // Stable-ish: locate the item container by its name, then find its Add to cart button.
    const item = this.page
      .locator('.inventory_item')
      .filter({ has: this.page.getByRole('link', { name: itemName }) });

    return item.getByRole('button', { name: /add to cart/i });
  }

  async assertLoaded() {
    await expect(this.title).toBeVisible();
  }

  async addItemToCart(itemName: string) {
    await this.assertLoaded();
    await this.itemAddToCartButton(itemName).click();
  }

  async goToCart() {
    await this.cartLink.click();
  }
}
