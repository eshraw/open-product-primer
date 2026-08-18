# Decision: BET-049 Explore native dsh plugin for oprim workspace tools
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Defer
- Date: 2026-08-18
- Owner: Eshane
- Review date: 2026-10-30

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — native tools/commands reading oprim state (`sequence.yaml`, active bets) inside a dsh session would be a real differentiator no other supported agent offers, but demand is unconfirmed and dsh's own user base is still tiny/preview-stage
- **Usability risk**: Medium — requires the user to separately `dsh plugin add` an oprim bundle into their profile, an extra step beyond `oprim init`/`update` that every other agent integration avoids
- **Feasibility risk**: High — dsh's plugin/bundle system installs into `$DSH_HOME/profiles/<name>`, a machine-local, per-user location, not the project directory; oprim's install model assumes project-local, git-versioned config that travels with the repo, so this needs a genuinely new distribution mechanism (an npm-published bundle) rather than reusing `install-agent.ts`
- **Business viability risk**: Low — no revenue/legal/ops exposure, but adds an external npm package to publish and maintain if pursued

## Why now
- "Everything is a plugin" in dsh's Cordis architecture exposes native tools and human-facing slash commands (`dsh-commands`, matching `/oprim:*`) that could read `oprim/sequence.yaml` and active-bet state directly inside a dsh session — capability no other currently-supported agent's install path can offer
- Discovered during BET-045's spike into `deepseek-ai/deepseek-harness`; scoped out of BET-048 to keep that bet's low-risk skill-file port unblocked
- Deferred: bundles install into `$DSH_HOME/profiles/<name>`, not the project directory, breaking the git-versioned, zero-install pattern every other oprim agent integration relies on; dsh is 5 days old and explicitly warns of compatibility-breaking changes

## Alternatives considered
- Fold into BET-048 — rejected, different distribution model (npm-published, profile-scoped vs. file-drop, project-scoped) and materially higher implementation/maintenance cost
- Build it anyway despite the profile-scoping mismatch, accepting that teammates need a separate `dsh plugin add` step — rejected for now given dsh's preview status and unconfirmed demand
- Skip entirely — rejected; the plugin/commands API is a genuine differentiator worth revisiting once dsh stabilizes

## Expected outcomes
- If picked back up: a published `dsh` bundle (an oprim-maintained npm package) registering read-only tools/commands over `oprim/` workspace state, installable via `dsh plugin add`
- Until then: no code ships from this bet; it stays a recorded opportunity

## Kill criteria / rollback trigger
- Revisit at review date only if dsh has (a) exited developer preview, and (b) either gained a project-scoped plugin install path or shown enough adoption to justify the profile-scoped, opt-in cost
- If neither condition holds, defer again rather than build against an unstable target

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
- Origin: BET-045 (Evaluate DeepSeek coding-agent harness options)
- Reference: https://github.com/deepseek-ai/deepseek-harness, docs/subsystems/commands.md, docs/user/develop/basic/publish.md
