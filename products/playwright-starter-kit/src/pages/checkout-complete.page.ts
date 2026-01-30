import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutCompletePage extends BasePage {
  private title = this.page.getByText('Checkout: Complete!', { exact: true });
  private header = this.page.getByRole('heading', { name: /thank you for your order/i });

  async assertLoaded() {
    await expect(this.title).toBeVisible();
    await expect(this.header).toBeVisible();
  }
}
