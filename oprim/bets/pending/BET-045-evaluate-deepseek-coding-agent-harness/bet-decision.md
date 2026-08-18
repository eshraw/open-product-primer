# Decision: BET-045 Evaluate DeepSeek coding-agent harness options

## Status
- Decision: Build now
- Date: 2026-08-17
- Owner: Eshane
- Review date: 2026-09-14

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — product adoption is cited as needing DeepSeek support, but which specific DeepSeek tool users actually run is unconfirmed
- **Usability risk**: Low — this bet produces a decision, not a shipped install path
- **Feasibility risk**: High — unlike Mistral Vibe, Qwen Code, and Kimi CLI, there is no single official first-party DeepSeek CLI to target; committing to implementation without picking a target risks building against the wrong (or a soon-abandoned) tool
- **Business viability risk**: Low — no revenue/legal/ops exposure

## Why now
- Product adoption needs DeepSeek support, but unlike Mistral/Qwen/Kimi there is no single official first-party DeepSeek CLI — the ecosystem is fragmented across community/semi-official tools (Deep Code, DeepSeek-TUI, deepseekcode) surfaced under deepseek-ai's own curated `awesome-deepseek-agent` list rather than one blessed harness
- Building agent support against the wrong tool would be wasted work; this bet is scoped as a research spike to pick a target before committing implementation effort, unlike the other three bets which can go straight to implementation

## Alternatives considered
- Commit directly to "Deep Code" now (the most-documented community option, supports Agent Skills) — deferred in favor of a short spike, since the DeepSeek harness landscape is very recent (DeepSeek's own harness was reportedly open-sourced 2026-08-13) and could still consolidate before the review date
- Skip DeepSeek entirely for now — rejected per the explicit product-adoption need

## Expected outcomes
- A bounded spike (by the review date) that produces a decision: which DeepSeek CLI(s) to target, their config/skill-directory conventions, and whether one or multiple tools warrant support — recorded as a follow-on implementation bet
- No shipped install-path code from this bet itself; it unblocks a properly scoped DeepSeek implementation bet

## Kill criteria / rollback trigger
- If no clear consolidation exists by the review date, defer DeepSeek support again and re-run the spike at the next review cycle rather than guessing at a target

## Findings (2026-08-18)
- Target identified: `deepseek-ai/deepseek-harness` (`dsh`), DeepSeek's own official harness — confirmed via the GitHub API against the `deepseek-ai` org (real, long-standing, 102k followers) and the `@deepseek-ai/dsh` npm package (published from the repo's CI, maintainer on a `@deepseek.com` address). Ends the "no first-party CLI" ambiguity this bet was scoped to resolve.
- `dsh` has a documented project-local skill-discovery convention (`docs/subsystems/skills.md`): kebab-case `<name>/SKILL.md` bundles or flat `<name>.md`, discovered at `<projectRoot>/.dsh/skills` (project root = nearest `.git` ancestor). This is architecturally identical to the SKILL.md format oprim already writes for Claude/Cursor/Kimi — a direct, low-risk fit for `install-agent.ts`.
- `dsh` separately has a Cordis-based plugin/bundle system ("everything is a plugin") exposing native tools and human-facing slash commands (`dsh-commands`) — a materially richer integration than a skill file, but bundles install into `$DSH_HOME/profiles/<name>` (machine-local, per-user), not the project directory. This breaks the git-versioned, zero-install pattern every other oprim agent integration relies on, so it does not fit `install-agent.ts` as-is.
- Caveats: `dsh` is 5 days old at time of research, explicitly labeled "developer preview" with compatibility-breaking changes expected; its primary UX is `dsh web` (Web UI) or `dsh --profile headless` (one-shot), not a shipped-by-default interactive terminal mode like the other seven supported agents.
- Decision split into two follow-on bets rather than one, since the two integration paths have different risk profiles and shouldn't block each other:
  - [BET-048](../BET-048-add-deepseek-harness-dsh-skill-install/bet-decision.md) — v1 skills-only port, matching the Kimi/Vibe/Qwen pattern. Build now.
  - [BET-049](../BET-049-explore-native-dsh-plugin-for-oprim/bet-decision.md) — native plugin/commands integration over oprim workspace state. Deferred pending dsh maturity past developer preview.

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
- Follow-on bets: BET-048 (build now), BET-049 (deferred)
- Reference: https://github.com/deepseek-ai/deepseek-harness
