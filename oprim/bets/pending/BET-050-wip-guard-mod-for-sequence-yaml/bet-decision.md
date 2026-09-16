# Decision: BET-050 Enforce sequence integrity live via WIP guard mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low — dev-facing integrity check, not user-facing; catches an existing failure mode earlier, doesn't change what's checked
- **Usability risk**: Low — mirrors an existing `oprim doctor` check, just moved earlier; no new mental model
- **Feasibility risk**: High — depends on `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`, an unverified/undocumented third-party env var (anthropics/claude-code#91870), not an official stable feature
- **Business viability risk**: Low — internal tooling only, no revenue/legal/ops exposure

## Why now
- `oprim doctor` only catches WIP-limit and dangling `blocked_by`/`unlocks` violations on manual invocation, after the invalid state is already committed to `sequence.yaml`
- `lib/integrity.ts` already has the check logic; a function-hook mod would just move it from batch to inline, no new logic needed

## Alternatives considered
- Keep relying on periodic `oprim doctor` runs (status quo) — cheaper, but leaves a window of invalid state between write and detection
- A pre-commit git hook — catches it at commit time, still later than authoring time

## Expected outcomes
- WIP-limit / dangling-ref violations caught: next `doctor` run → immediately at write time (100% of writes checked inline)

## Kill criteria / rollback trigger
- If `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is not confirmed as an officially supported, stable Claude Code feature by the review date, kill and continue relying on `oprim doctor`

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
