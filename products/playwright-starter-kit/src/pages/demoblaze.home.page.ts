import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DemoblazeHomePage extends BasePage {
  private logo = this.page.getByRole('link', { name: /product store/i });
  private signUpLink = this.page.getByRole('link', { name: /sign up/i });
  private logInLink = this.page.getByRole('link', { name: /log in/i });
  private logOutLink = this.page.getByRole('link', { name: /log out/i });
  private welcome = this.page.locator('#nameofuser');

  async goto() {
    await this.page.goto('/');
  }

  async assertLoaded() {
    await expect(this.logo).toBeVisible();
  }

  async openSignup() {
    await this.signUpLink.click();
  }

  async openLogin() {
    await this.logInLink.click();
  }

  async assertLoggedIn(username: string) {
    await expect(this.welcome).toContainText(username);
    await expect(this.logOutLink).toBeVisible();
  }

  async logout() {
    await this.logOutLink.click();
    await expect(this.logInLink).toBeVisible();
  }

  productCardByName(name: string) {
    return this.page.locator('.card').filter({ has: this.page.getByRole('link', { name }) });
  }

  async openProduct(name: string) {
    await this.productCardByName(name).getByRole('link', { name }).click();
  }
}
