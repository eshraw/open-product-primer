# Changelog

All notable changes to `@open-product-primer/cli` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
