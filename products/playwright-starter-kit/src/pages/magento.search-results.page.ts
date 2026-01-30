import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MagentoSearchResultsPage extends BasePage {
  private results = this.page.locator('.products-grid, .products.list');

  productLinkByName(name: string) {
    // Use product-item-link anchor text
    return this.page.getByRole('link', { name }).first();
  }

  async assertLoaded() {
    await expect(this.results).toBeVisible();
  }

  async openProduct(name: string) {
    await this.assertLoaded();
    await this.productLinkByName(name).click();
  }
}
