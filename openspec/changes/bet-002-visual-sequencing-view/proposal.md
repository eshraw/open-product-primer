## Context

- Bet: BET-002 (`oprim/bets/BET-002/bet-decision.md`)

## Why

The sequencing board only exists as raw YAML — understanding the roadmap requires CLI knowledge or agent access. A static visual committed alongside `sequence.yaml` lets contributors and stakeholders orient to the product roadmap at a glance in GitHub, without tooling.

## What Changes

- A Mermaid diagram (or equivalent static format) is auto-generated from `sequence.yaml` and committed as `sequence-view.md` (or similar) in the primer directory
- The `/oprim:sequence` command (or equivalent) regenerates the visual whenever `sequence.yaml` changes
- The visual renders in GitHub and shows bets grouped by bucket (now / next / later / backlog) with dependency relationships visible

## Capabilities

### New Capabilities
- `sequencing-view`: Static visual rendering of the sequencing board derived from `sequence.yaml`, committed to the repo and renderable in GitHub

### Modified Capabilities
<!-- No existing spec-level requirements change — the visual is additive. -->

## Impact

- `oprim/sequence.yaml` — read as source of truth for the view
- New file committed alongside or near `sequence.yaml` (e.g., `oprim/sequence-view.md`)
- `/oprim:sequence` skill or equivalent — extended to regenerate the view
- No breaking changes to existing data model or other commands
