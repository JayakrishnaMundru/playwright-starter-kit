import dotenv from 'dotenv';

dotenv.config();

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  baseUrl: req('BASE_URL'),
  userEmail: req('E2E_USER_EMAIL'),
  userPassword: req('E2E_USER_PASSWORD'),
};
