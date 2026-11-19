# Sonaraim E2E Suite

Versioned Playwright suite against the public domain (`sonaraim.apulab.info`
and subdomains per `REMOTE.md`). Covers health, metrics, auth gates, render +
screenshots, authenticated studio submit, and the public instant clip.

## Run on the sandbox (required; never local)

```bash
ssh sandbox-ud-ord
git clone <repo-url> ~/sonaraim-e2e && cd ~/sonaraim-e2e
git fetch origin test/23-playwright-e2e-suite && git checkout test/23-playwright-e2e-suite
cd tests/e2e && npm ci
npx playwright install --with-deps chromium   # needs sudo -n
# Public-only pass (auth tests skip):
npx playwright test --config=playwright.config.mjs
# Full pass with operator token (from sandbox .env only, never logged):
export E2E_ADMIN_TOKEN="$(grep -E '^ADMIN_OPERATOR_TOKEN=' ~/sonaraim/.env | cut -d= -f2-)"
npx playwright test --config=playwright.config.mjs
```

Screenshots land in the repo-root `debug/` (gitignored).

## Run in CI

Public run only: no secrets configured, so authenticated specs skip via
`test.skip`. See `.github/workflows/e2e.yml`. Screenshots upload as an
artifact.

## Env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `E2E_BASE_DOMAIN` | `sonaraim.apulab.info` | Base public domain; subdomains derived |
| `E2E_ADMIN_TOKEN` | (unset = skip auth specs) | Operator Bearer for studio submit |
