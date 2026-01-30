import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MagentoAuthPage extends BasePage {
  // Create account
  private createTitle = this.page.getByRole('heading', { name: /create new customer account/i });
  private firstName = this.page.getByLabel(/first name/i);
  private lastName = this.page.getByLabel(/last name/i);
  private email = this.page.getByLabel(/email/i);
  private password = this.page.getByLabel(/^password$/i);
  private confirmPassword = this.page.getByLabel(/confirm password/i);
  private createAccountBtn = this.page.getByRole('button', { name: /create an account/i });

  // Sign in
  private signInTitle = this.page.getByRole('heading', { name: /customer login/i });
  private loginEmail = this.page.getByLabel(/email/i);
  private loginPassword = this.page.getByLabel(/^password$/i);
  private signInBtn = this.page.getByRole('button', { name: /^sign in$/i });

  async assertCreateLoaded() {
    await expect(this.createTitle).toBeVisible();
  }

  async createAccount(data: { firstName: string; lastName: string; email: string; password: string }) {
    await this.assertCreateLoaded();
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.password.fill(data.password);
    await this.confirmPassword.fill(data.password);
    await this.createAccountBtn.click();

    // Post-create typically redirects to account dashboard
    await expect(this.page).toHaveURL(/customer\/account/);
  }

  async assertSignInLoaded() {
    await expect(this.signInTitle).toBeVisible();
  }

  async signIn(email: string, password: string) {
    await this.assertSignInLoaded();
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.signInBtn.click();

    await expect(this.page).toHaveURL(/customer\/account/);
  }
}
