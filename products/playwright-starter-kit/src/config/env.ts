import dotenv from 'dotenv';

dotenv.config();

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

export const env = {
  baseUrl: req('BASE_URL'),
  userEmail: opt('E2E_USER_EMAIL'),
  userPassword: opt('E2E_USER_PASSWORD'),
};
