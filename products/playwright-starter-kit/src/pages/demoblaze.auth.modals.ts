import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DemoblazeAuthModals extends BasePage {
  private signupModal = this.page.locator('#signInModal');
  private signupUsername = this.signupModal.locator('#sign-username');
  private signupPassword = this.signupModal.locator('#sign-password');
  private signupBtn = this.signupModal.getByRole('button', { name: /sign up/i });

  private loginModal = this.page.locator('#logInModal');
  private loginUsername = this.loginModal.locator('#loginusername');
  private loginPassword = this.loginModal.locator('#loginpassword');
  private loginBtn = this.loginModal.getByRole('button', { name: /log in/i });

  async signup(username: string, password: string) {
    await expect(this.signupModal).toBeVisible();
    await this.signupUsername.fill(username);
    await this.signupPassword.fill(password);
    await this.signupBtn.click();

    // Demoblaze confirms via browser alert.
    const dialog = await this.page.waitForEvent('dialog', { timeout: 15000 });
    const msg = dialog.message();
    await dialog.accept();
    if (!/sign up successful/i.test(msg) && !/this user already exist/i.test(msg)) {
      throw new Error(`Unexpected signup alert: ${msg}`);
    }
  }

  async login(username: string, password: string) {
    await expect(this.loginModal).toBeVisible();
    await this.loginUsername.fill(username);
    await this.loginPassword.fill(password);
    await this.loginBtn.click();

    // Logged-in indicator is #nameofuser on home.
    await expect(this.page.locator('#nameofuser')).toContainText(username, { timeout: 15000 });
  }
}
