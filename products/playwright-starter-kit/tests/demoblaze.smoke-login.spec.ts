import { test } from '../src/fixtures/test';

test('user can signup or login (Demoblaze)', async ({ loginOrSignup }) => {
  await loginOrSignup();
});
