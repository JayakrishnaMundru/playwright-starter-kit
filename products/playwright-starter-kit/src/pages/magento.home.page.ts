import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MagentoHomePage extends BasePage {
  private signInLink = this.page.getByRole('link', { name: /sign in/i });
  private createAccountLink = this.page.getByRole('link', { name: /create an account/i });
  private search = this.page.getByRole('combobox', { name: /search/i });

  async goto() {
    await this.page.goto('/');
  }

  async assertLoaded() {
    // Luma often has a header search on all pages
    await expect(this.search).toBeVisible();
  }

  async openSignIn() {
    await this.signInLink.click();
  }

  async openCreateAccount() {
    await this.createAccountLink.click();
  }

  async searchFor(term: string) {
    await this.search.fill(term);
    await this.search.press('Enter');
  }
}
