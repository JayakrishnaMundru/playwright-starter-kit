import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutOverviewPage extends BasePage {
  private title = this.page.getByText('Checkout: Overview', { exact: true });
  private finishBtn = this.page.getByRole('button', { name: /finish/i });

  itemByName(itemName: string) {
    return this.page.locator('.cart_item').filter({ has: this.page.getByRole('link', { name: itemName }) });
  }

  async assertLoaded() {
    await expect(this.title).toBeVisible();
  }

  async assertHasItem(itemName: string) {
    await expect(this.itemByName(itemName)).toBeVisible();
  }

  async finish() {
    await this.finishBtn.click();
  }
}
