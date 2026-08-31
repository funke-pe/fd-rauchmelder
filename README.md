# wp-plugin-smoketest

Runtime **smoketest** for the funke-pe WordPress plugin repos, as a required
GitHub Action check before a PR merge.

It boots **real WordPress** via [WordPress Playground](https://wordpress.org/playground)
with the plugin mounted and activated, logs into `wp-admin` with **Playwright**,
and fails if any admin page throws a PHP fatal / "There has been a critical error".

No Docker: Playground runs natively on the GitHub runner (Node only). The runner
is already a disposable environment.

## What it checks (generic, no per-plugin config needed)

1. Admin login via `wp-login.php` succeeds.
2. `plugins.php` loads with no activation error and no fatal.
3. Every admin page the plugin registers (menu links carrying a `page=` param),
   plus the dashboard, renders without a PHP fatal / critical error and without
   an HTTP 5xx.

## Use it in a plugin repo

Add `.github/workflows/smoketest.yml`:

```yaml
name: Smoketest
on: pull_request
jobs:
  smoketest:
    uses: funke-pe/wp-plugin-smoketest/.github/workflows/smoketest.yml@main
    permissions:
      contents: read
      pull-requests: write  # lets the smoketest post failure details as a PR comment
    # Optional:
    # with:
    #   php-version: '8.3'
    #   wp-version: 'latest'
    #   plugin-name: 'FD Newspack Extension'  # asserts it's active on plugins.php
```

Then mark **Smoketest** as a required status check in the repo's branch
protection for `main`.

## Optional per-plugin deep checks

Drop either file into the plugin repo under `.smoketest/`:

- `.smoketest/blueprint.json` — a [Playground Blueprint](https://wordpress.org/playground/builder/)
  run at boot (install a theme, dependency plugins, seed content, etc.).
- `.smoketest/*.spec.ts` — extra Playwright tests, added to the suite. They share
  the logged-in admin session and can hit `SMOKE_BASE_URL`.

## Layout

```
.github/workflows/
  smoketest.yml     # reusable workflow (workflow_call) — the check plugins call
  self-test.yml     # guards this harness (clean fixture passes, broken one fails)
harness/
  playwright.config.ts
  tests/
    auth.setup.ts   # logs in, stores the admin session
    smoke.spec.ts   # plugins.php + admin-menu crawl
  boot.sh         # boots Playground, fails fast if the plugin can't activate
  fixtures/
    clean-plugin/               # proves a healthy plugin passes
    broken-plugin/              # runtime fatal on an admin page (harness self-check)
    broken-activation-plugin/   # parse error → fails fast at boot (harness self-check)
```

## Run locally

```bash
cd harness
npm install
npx playwright install chromium
# terminal 1: boot WP with a plugin mounted
npx @wp-playground/cli server --auto-mount=/path/to/your-plugin --port=9400 --login --define-bool WP_DEBUG true
# terminal 2: run the smoketest
SMOKE_BASE_URL=http://127.0.0.1:9400 npx playwright test
```
