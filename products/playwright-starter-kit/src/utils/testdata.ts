import { randomUUID } from 'crypto';

export function makeRandomUser() {
  const id = randomUUID().slice(0, 8);
  const email = `jk.playwright.${id}@example.com`;
  const password = `Pw!${id}Aa#12345`;
  return {
    firstName: 'JK',
    lastName: `Auto${id}`,
    email,
    password,
  };
}
