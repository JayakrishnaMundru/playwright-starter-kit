import { expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Demo POM for https://the-internet.herokuapp.com/secure
 */
export class DashboardPage extends BasePage {
  private heading = this.page.getByRole('heading', { name: /secure area/i });

  async assertLoaded() {
    await expect(this.heading).toBeVisible();
  }
}
