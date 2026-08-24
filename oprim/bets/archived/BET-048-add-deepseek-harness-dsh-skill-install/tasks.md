# Tasks: deepseek-harness-agent-support

## 1. Detection
- [x] 1.1 Add `.dsh/` directory check to `detectAvailableAgents()` in `lib/detect.ts`, returning `'dsh'` when present
- [x] 1.2 Add detect.ts tests: `.dsh/` present → includes `'dsh'`; `.dsh/` absent → excludes `'dsh'`

## 2. Skill install
- [x] 2.1 Add `dsh` target to `lib/install-agent.ts` writing `SKILL.md` files to `.dsh/skills/<name>/SKILL.md` for pdr, bet, note, criteria, review, archive, sequence
- [x] 2.2 Create `.dsh/` directory during install if absent, with a notice printed
- [x] 2.3 Print a confirmation line per `.dsh/skills/<name>/SKILL.md` written

## 3. AGENTS.md instruction block
- [x] 3.1 Wire `dsh` into the shared AGENTS.md dual-install path (same delimiter block as Codex/Poolside/Vibe/Qwen)
- [x] 3.2 Verify idempotent re-run replaces only the `<!-- oprim:start -->`/`<!-- oprim:end -->` block, preserving surrounding content

## 4. Docs and test parity
- [x] 4.1 Add DeepSeek Harness (`dsh`) to the README's supported-agent list
- [x] 4.2 Add install-agent.ts tests for `dsh` mirroring Kimi/Vibe/Qwen coverage (skills written, AGENTS.md block written, re-run idempotency)
