# Playwright Starter Kit (TypeScript) — Page Object Model

A clean, CI-ready Playwright + TypeScript starter kit using **Page Object Model (POM)**.

This repo ships with a **runnable demo** using: https://the-internet.herokuapp.com/login

## What you get

- Playwright + TypeScript setup
- Page Object Model (POM) structure
- `.env`-driven configuration
- HTML report + artifacts (screenshots/traces/video)
- GitHub Actions workflow (CI)

## Quick start (local)

### 1) Install

```bash
cd products/playwright-starter-kit
npm i
npx playwright install
```

### 2) Configure env

```bash
cp .env.example .env
```

### 3) Run tests

```bash
npm run test:e2e
npm run report
```

## Structure

- `src/pages/` → page objects
- `src/fixtures/test.ts` → custom fixtures (shared pages + common actions)
- `tests/` → test specs

## Demo app notes

Defaults target `the-internet.herokuapp.com` login page.

Credentials in `.env.example`:
- username: `tomsmith`
- password: `SuperSecretPassword!`

Swap `BASE_URL` + selectors in `LoginPage`/`DashboardPage` for your app.

## CI

Workflow file: `.github/workflows/e2e.yml`

Set repository secrets:
- `BASE_URL`
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`

## License

Add your commercial license text here (personal vs team vs org).
