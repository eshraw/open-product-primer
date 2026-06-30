# Discovery: BET-022 Align oprim workspace structure with Open Knowledge Format

## Problem
<!-- What specific pain or gap are we solving? Be concrete. -->
Agents consuming oprim-managed projects must read bespoke CLAUDE.md files and learn project-specific conventions. There's no portable, vendor-neutral way to hand a new agent the structured knowledge about a project's bets, decisions, and outcomes — every agent integration requires custom wiring.

## User / Context
<!-- Who experiences this? In what workflow moment? -->
Developers setting up a new AI agent on an oprim-managed project. The moment they need the agent to understand "what are the active bets?" or "what's the reasoning behind this decision?" — currently answered only by reading markdown files in an idiosyncratic structure.

## Hypotheses to test
<!-- What do we believe to be true that we need to validate? -->
- H1: oprim's existing markdown+YAML structure can be made OKF-compliant with additive changes only (no breaking rewrites)
- H2: An OKF-compliant oprim workspace meaningfully reduces agent onboarding time vs the current CLAUDE.md baseline

## Open questions
<!-- What do we not know yet that could change the direction? -->
- What OKF `type` values map cleanly to oprim concepts (bet, PDR, openspec change)?
- Does OKF's `index.md` convention conflict with anything in oprim's current layout?
- Is there an OKF validator we can run in CI to confirm compliance?
- How do OKF consumers (agents, visualizers) discover and load an OKF bundle — git repo root, explicit path, or manifest?

## Signal gathered
<!-- Research, usage data, conversations, experiments — add as you learn -->
- OKF v0.1 spec: https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf
- Google Cloud blog overview: https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
- OKF structure: markdown files with YAML frontmatter, `type` field required, directory of concepts, `index.md` per directory
- oprim structure: `oprim/bets/BET-NNN/bet-decision.md`, `oprim/decisions/PDR-NNN/`, `openspec/changes/` — all markdown+YAML

## Current thinking
<!-- Working hypothesis on what to build and why -->
Add OKF-compatible `type` frontmatter to oprim templates (bet-decision, PDR, openspec change) and generate an `index.md` at the `oprim/` root. Feature-flag the OKF output similar to PDR surfacing — off by default, opt-in via `oprim init`. This keeps the change additive and reversible.

## Next steps
<!-- Concrete actions to advance discovery -->
- [ ] Map oprim artifact types to OKF concept types (bet → ?, PDR → ?, openspec change → ?)
- [ ] Audit oprim template frontmatter for OKF compatibility (what's missing, what conflicts)
- [ ] Test: load an oprim workspace into an OKF-aware agent and measure orientation time vs CLAUDE.md baseline
- [ ] Check if OKF has a reference validator or linter in the knowledge-catalog repo
