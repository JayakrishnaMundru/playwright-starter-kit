import { expect, Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async waitForUrlContains(partial: string) {
    const escaped = partial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(this.page).toHaveURL(new RegExp(escaped));
  }
}
