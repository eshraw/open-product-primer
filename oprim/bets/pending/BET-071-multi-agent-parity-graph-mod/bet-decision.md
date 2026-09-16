# Decision: BET-071 Visualize multi-agent install parity as a graph

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — only matters to projects that fork a workflow and install for multiple agents; a graph shows which of the 9 targets (claude/cursor/codex/gemini/poolside/vibe/qwen/kimi/dsh) diverge at a glance instead of a flat pass/fail list
- **Usability risk**: Low — additive visualization
- **Feasibility risk**: Medium — the on-demand version can render over `oprim doctor`'s existing Claude-specific skill-drift check today; full 9-target parity data depends on BET-058 shipping, which depends on the unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- `oprim doctor` already produces Claude-specific skill-drift data; a graph would make which install targets diverge from a workflow's source visually obvious once broader parity data (BET-058) exists

## Alternatives considered
- Status quo: flat pass/fail list output
- Scope to Claude-only drift first (available today) rather than waiting on BET-058's full 9-target detection

## Expected outcomes
- Parity visualization on top of existing (or BET-058's full) drift detection

## Kill criteria / rollback trigger
- If usage data shows near-zero projects fork workflows for multi-agent installs, kill as low-value (mirrors BET-058's kill criterion)

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
