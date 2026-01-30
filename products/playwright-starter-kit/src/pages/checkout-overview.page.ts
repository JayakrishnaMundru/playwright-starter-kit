import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutOverviewPage extends BasePage {
  private title = this.page.getByText('Checkout: Overview', { exact: true });
  private finishBtn = this.page.getByRole('button', { name: /finish/i });

  // Optional content sections
  private paymentInfo = this.page.getByText(/payment information/i);
  private shippingInfo = this.page.getByText(/shipping information/i);
  private priceTotal = this.page.getByText(/price total/i);

  itemByName(itemName: string) {
    return this.page.locator('.cart_item').filter({ has: this.page.getByRole('link', { name: itemName }) });
  }

  async assertLoaded() {
    await expect(this.title).toBeVisible();
  }

  async assertHasItem(itemName: string) {
    await expect(this.itemByName(itemName)).toBeVisible();
  }

  async assertPaymentSummaryVisible() {
    await expect(this.paymentInfo).toBeVisible();
    await expect(this.shippingInfo).toBeVisible();
    await expect(this.priceTotal).toBeVisible();
  }

  async finish() {
    await this.finishBtn.click();
  }
}
