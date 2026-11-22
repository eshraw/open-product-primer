## 1. Shared parsing

- [x] 1.1 Extract bet-meta parsing (decision path, door type, risks, review date) from `commands/ovw.ts` to `lib/bet-meta.ts`; existing ovw tests unchanged

## 2. View model

- [x] 2.1 `lib/portfolio/view.ts` `buildPortfolioView(projectRoot, today)` over products + portfolio boards
- [x] 2.2 Dependencies: unresolved and out-of-order qualified `blocked_by`
- [x] 2.3 Coverage: objectives without Now/Next bets (incl. via delegation), Now/Next bets without objectives
- [x] 2.4 Hygiene: overdue review dates, promoted bets missing criteria
- [x] 2.5 Tests with 2–3 local temp product workspaces, injected `today`; stale and unreachable sources

## 3. Rendering

- [x] 3.1 `--portfolio` flag on `oprim ovw` with mode guard
- [x] 3.2 Terminal renderer (no ANSI when not a TTY); `--json`; `--write` to `oprim/portfolio-view.md` with OKF on/off
- [x] 3.3 Tests: deterministic output snapshot; JSON keys; markdown frontmatter parseable by js-yaml

## 4. WIP checks

- [x] 4.1 `lib/portfolio/wip.ts` `checkPortfolioWip()`; wire into doctor/validate in portfolio mode
- [x] 4.2 Tests: per-product exceed, portfolio-wide exceed, sunset products excluded

## 5. Docs

- [x] 5.1 README `ovw --portfolio` section; CLAUDE.md layout entry
