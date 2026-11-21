## 1. Shared parsing

- [ ] 1.1 Extract bet-meta parsing (decision path, door type, risks, review date) from `commands/ovw.ts` to `lib/bet-meta.ts`; existing ovw tests unchanged

## 2. View model

- [ ] 2.1 `lib/portfolio/view.ts` `buildPortfolioView(projectRoot, today)` over products + portfolio boards
- [ ] 2.2 Dependencies: unresolved and out-of-order qualified `blocked_by`
- [ ] 2.3 Coverage: objectives without Now/Next bets (incl. via delegation), Now/Next bets without objectives
- [ ] 2.4 Hygiene: overdue review dates, promoted bets missing criteria
- [ ] 2.5 Tests with 2–3 local temp product workspaces, injected `today`; stale and unreachable sources

## 3. Rendering

- [ ] 3.1 `--portfolio` flag on `oprim ovw` with mode guard
- [ ] 3.2 Terminal renderer (no ANSI when not a TTY); `--json`; `--write` to `oprim/portfolio-view.md` with OKF on/off
- [ ] 3.3 Tests: deterministic output snapshot; JSON keys; markdown frontmatter parseable by js-yaml

## 4. WIP checks

- [ ] 4.1 `lib/portfolio/wip.ts` `checkPortfolioWip()`; wire into doctor/validate in portfolio mode
- [ ] 4.2 Tests: per-product exceed, portfolio-wide exceed, sunset products excluded

## 5. Docs

- [ ] 5.1 README `ovw --portfolio` section; CLAUDE.md layout entry
