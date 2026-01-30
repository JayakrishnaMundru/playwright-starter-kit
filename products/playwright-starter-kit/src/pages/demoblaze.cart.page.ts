import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DemoblazeCartPage extends BasePage {
  private placeOrderBtn = this.page.getByRole('button', { name: /place order/i });

  async goto() {
    await this.page.goto('/cart.html');
  }

  async assertLoaded() {
    await expect(this.placeOrderBtn).toBeVisible();
  }

  rowByProductName(name: string) {
    return this.page.locator('tr').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async assertHasItem(name: string) {
    await expect(this.rowByProductName(name)).toBeVisible();
  }
}
