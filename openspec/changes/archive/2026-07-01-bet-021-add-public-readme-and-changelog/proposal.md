## Why

oprim is at v0.14.0 and ready for a 1.0.0 version bump, but the public-facing docs aren't ready for external users: the README has a package name typo, leads with `open-product-primer` instead of the canonical `oprim` alias, and the CHANGELOG contains only auto-generated commit lines with no narrative context. A developer arriving from npm or GitHub today cannot self-onboard.

## What Changes

- Fix package name in README install command (`@open-product-oprim/cli` → `@open-product-primer/cli`)
- Flip command ordering so `oprim` is the primary alias throughout, `open-product-primer` demoted to footnote
- Ensure the quickstart narrative is complete enough for a developer with no prior context to install and run `oprim init`
- Add a hand-written narrative summary block to `packages/cli/CHANGELOG.md` above the auto-generated entries, covering the arc from 0.1 → 0.14 so 1.0.0 release notes have context

## Capabilities

### New Capabilities
- `changelog-narrative`: CHANGELOG carries a human-readable arc of 0.x development so 1.0.0 release notes have context

### Modified Capabilities
- `readme-first-contact`: extend accuracy requirements — package name and primary alias must be correct; `oprim` must be the canonical command throughout

## Impact

- `README.md` (root) — install command, command examples, npm package section
- `packages/cli/CHANGELOG.md` — prepend narrative block above auto-generated entries

## Context

- Promoted from BET-021 (`oprim/bets/BET-021-add-public-readme-quickstart-and-changelog/bet-decision.md`)
