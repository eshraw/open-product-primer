# Changelog

All notable changes to `@open-product-primer/cli` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-06-03

### Fixed

- `oprim-bet` next ID detection now works with slug-suffixed bet directories (e.g. `BET-010-improve-bet-naming`) — the regex `BET-(\d+)$` was updated to `BET-(\d+)`, removing the end-anchor that prevented matches when a slug followed the number

[0.4.1]: https://github.com/eshraw/open-product-primer/releases/tag/v0.4.1

## [0.4.0] - 2026-06-03

### Added

- `oprim:archive` skill — archives a completed bet by moving it to `oprim/bets/archived/BET-NNN/` and removing its entry from `sequence.yaml`; warns if other active bets reference it via `blocked_by` or `unlocks`
- `archive.md` command wrapper — exposes `/oprim:archive` as a Claude Code slash command
- `UserPromptSubmit` + `Stop` hooks for co-archival coordination — when `/opsx:archive` is run, the Stop hook detects the linked bet ID from the archived `proposal.md` and prompts Claude to invoke `oprim:archive` automatically
- `oprim init` and `oprim update` now prompt for speccing framework (OpenSpec or None) on first install and write `.claude/hooks/config.json`, `on-prompt-submit.sh`, and `on-stop.sh`
- `oprim doctor` now validates that `on-prompt-submit.sh` and `on-stop.sh` are present and registered in `.claude/settings.json`

### Changed

- `oprim:bet` now displays a naming tip ("verb + object [for context]") before asking for the bet title, and validates the title has at least 4 words or 25 characters — warns and offers a suggested reformulation if the title is too vague
- `bet-decision.md` template includes an inline naming tip comment in the header

### Removed

- Legacy `on-skill-archive.sh` hook and its `PostToolUse/Skill` entry in `settings.json` — replaced by the `on-prompt-submit.sh` + `on-stop.sh` hook pair; `oprim update` tombstones and removes the old file automatically

[0.4.0]: https://github.com/eshraw/open-product-primer/releases/tag/v0.4.0

## [0.3.0] - 2026-05-29

### Added

- `oprim sequence` command — generates `oprim/sequence-view.md`, a Markdown board grouping all bets by status (now / next / later / done) with sequencing metadata

### Changed

- `oprim update` now removes legacy command wrappers (`bet.md`, `criteria.md`, `pdr.md`, `review.md`) from `.claude/commands/oprim/` that were made redundant when those workflows moved to skills-only in v0.2.0

### Removed

- Claude Code command wrappers for `oprim-bet`, `oprim-criteria`, `oprim-pdr`, and `oprim-review` — these are now invoked as skills directly, eliminating redundant UI entries; `promote` and `sequence` commands remain as they carry distinct arguments

[0.3.0]: https://github.com/eshraw/open-product-primer/releases/tag/v0.3.0

## [0.2.0] - 2026-05-29

### Added

- `oprim migrate` command — renames `primer/` to `oprim/` in an existing repo; idempotent and safe to re-run
- `oprim init` now writes `oprim/templates/discovery.md` — a structured template for problem framing, user research signals, competitive context, and open questions
- `oprim:bet` skill now prompts "Do you want to scaffold a discovery.md now? (y/N)" after writing `bet-decision.md`; writes `oprim/bets/BET-NNN/discovery.md` on confirmation
- `oprim doctor` now warns (yellow `○`) for each bet directory that contains `bet-decision.md` but no `discovery.md`

### Changed

- **BREAKING**: workspace directory renamed from `primer/` to `oprim/`; existing repos must run `oprim migrate` before using this version
- `oprim init` now scaffolds `oprim/` instead of `primer/`
- `oprim doctor` now validates `oprim/` scaffold; warns when `primer/` detected without `oprim/`
- All agent skills and command content updated to reference `oprim/` paths

[0.2.0]: https://github.com/eshraw/open-product-primer/releases/tag/v0.2.0

## [0.1.2] - 2026-05-29

### Changed

- CLI program name in `--help` output changed from `open-product-primer` to `oprim` (BET-004 branding consolidation)
- `oprim init` command description and startup banner now read `oprim` instead of "Open Product Primer"
- `oprim doctor` command description and startup banner now read `oprim` instead of "Open Product Primer"
- `oprim:promote` skill now names OpenSpec changes as `bet-NNN-<slug>` instead of a date-prefixed name

[0.1.2]: https://github.com/eshraw/open-product-primer/releases/tag/v0.1.2

## [0.1.0] - 2026-05-26

### Added

- Global CLI with `init`, `update`, `doctor`, and `measure` commands
- Bin aliases `open-product-primer` and `oprim`
- Project-local `primer/` scaffold with templates and integration detection (OpenSpec, Graphify)
- Agent skill and command installation for Claude Code and Cursor
- KPI measurement pipeline (Amplitude and BigQuery) with criteria contracts

[0.1.0]: https://github.com/eshraw/open-product-primer/releases/tag/v0.1.0
