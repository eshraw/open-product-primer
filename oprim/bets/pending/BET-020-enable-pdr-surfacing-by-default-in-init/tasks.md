## 1. Flip the default

- [x] 1.1 Change `promptPdrSurfacing()` default in `packages/cli/src/lib/install-agent.ts` from `false` to `true`
- [x] 1.2 Update the prompt message from `(y/N)` to `(Y/n)` to reflect the new default

## 2. Tests

- [x] 2.1 Add/update a test asserting `oprim init` installs PDR surfacing skills when the user accepts the default (presses Enter / answers "y")
- [x] 2.2 Add/update a test asserting a user can still opt out ("n") and get today's unchanged install behavior
- [x] 2.3 Add/update a test asserting `oprim update` re-prompts with the same default-true behavior

## 3. Drift checks

- [x] 3.1 Confirm `oprim doctor`/`oprim validate` skill-version-drift checks don't require updates (no installed skill content changes — only the install-time prompt default)
