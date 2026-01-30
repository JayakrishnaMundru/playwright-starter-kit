import { test, expect } from '../src/fixtures/test';

/**
 * Required flow:
 * - Signup new user
 * - Login
 * - Add product to cart
 * - Logout
 * - Login again
 * - Verify product still in cart
 */

test('signup + login + cart persistence across logout/login (Demoblaze)', async ({
  page,
  homePage,
  auth,
  productPage,
  cartPage,
}) => {
  // Create a fresh user (Demoblaze is flaky with reusing usernames)
  const { username, password } = await (async () => {
    // use the built-in helper which signs up+logs in if creds missing
    // but we want explicit signup each time, so we call it and read creds it created
    const creds = await (async () => {
      // NOTE: using fixture function directly isn't possible here, so do inline:
      const { randomUUID } = await import('crypto');
      const id = randomUUID().slice(0, 8);
      const uname = `jk_${id}`;
      const pw = `Pw!${id}Aa#12345`;

      await homePage.goto();
      await homePage.openSignup();
      await auth.signup(uname, pw);

      await homePage.openLogin();
      await auth.login(uname, pw);
      await homePage.assertLoggedIn(uname);

      return { username: uname, password: pw };
    })();
    return creds;
  })();

  const productName = 'Samsung galaxy s6';

  // Add product
  await homePage.goto();
  await homePage.openProduct(productName);
  await expect(page).toHaveURL(/prod\.html\?idp_=/);
  await productPage.addToCart();

  // Verify in cart
  await cartPage.goto();
  await cartPage.assertLoaded();
  await cartPage.assertHasItem(productName);

  // Logout
  await homePage.goto();
  await homePage.logout();

  // Login again
  await homePage.openLogin();
  await auth.login(username, password);
  await homePage.assertLoggedIn(username);

  // Verify cart still has item
  await cartPage.goto();
  await cartPage.assertLoaded();
  await cartPage.assertHasItem(productName);
});
