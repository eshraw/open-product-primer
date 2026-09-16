# Decision: BET-058 Check multi-agent install parity via mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — matters only to projects that fork a workflow (`oprim/workflows/<id>.*` override) and install for multiple agents; a narrower audience than the other mods
- **Usability risk**: Low — a parity warning is additive
- **Feasibility risk**: High — depends on unverified hooks system; also needs to compare rendered output across up to 9 install targets (claude/cursor/codex/gemini/poolside/vibe/qwen/kimi/dsh), more surface area than a single-file check
- **Business viability risk**: Low — internal tooling only

## Why now
- Today, `oprim doctor`'s skill-drift check only compares installed Claude skill content against the CLI-bundled default — it doesn't check whether a forked workflow override rendered consistently across the other 8 agent targets
- A hook on `install-agent.ts`-driven writes could catch this at install/render time

## Alternatives considered
- Status quo: only Claude-specific skill drift is checked; other agent targets aren't compared to each other at all

## Expected outcomes
- Cross-agent workflow content parity: never explicitly checked today → checked at install/render time

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If usage data shows near-zero projects actually fork workflows for multi-agent installs, kill as low-value

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
