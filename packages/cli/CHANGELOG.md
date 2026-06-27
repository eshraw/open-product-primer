# Changelog

All notable changes to `@open-product-primer/cli` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0](https://github.com/eshraw/open-product-primer/compare/cli-v0.10.0...cli-v0.11.0) (2026-06-27)


### Features

* improve user first xp ([6f784d8](https://github.com/eshraw/open-product-primer/commit/6f784d8b286ab369e4f70db2efc0fd020d8e8b7a))

## [0.10.0](https://github.com/eshraw/open-product-primer/compare/cli-v0.9.0...cli-v0.10.0) (2026-06-26)


### Features

* improve naming dir ([ae9b28a](https://github.com/eshraw/open-product-primer/commit/ae9b28af915aec9b9c3661ff72a39724c2d0a1d8))

## [0.9.0](https://github.com/eshraw/open-product-primer/compare/cli-v0.8.0...cli-v0.9.0) (2026-06-24)


### Features

* improve sequencing ([c7a4d84](https://github.com/eshraw/open-product-primer/commit/c7a4d84cbdcc63abc6245777c4cd59b55f94d6ed))

## [0.8.0](https://github.com/eshraw/open-product-primer/compare/cli-v0.7.2...cli-v0.8.0) (2026-06-22)


### Features

* replace python3 subprocess calls in on-prompt-submit hook with … ([6514253](https://github.com/eshraw/open-product-primer/commit/6514253e2b9ac2cc2d069f8ed9ac7b9f6643c026))
* replace python3 subprocess calls in on-prompt-submit hook with pure grep/bash ([fa0564d](https://github.com/eshraw/open-product-primer/commit/fa0564df69de5de2403f466637d93f10af8428be))

## [0.7.2](https://github.com/eshraw/open-product-primer/compare/cli-v0.7.1...cli-v0.7.2) (2026-06-22)


### Bug Fixes

* hook regex to identify archive command ([f0a40e0](https://github.com/eshraw/open-product-primer/commit/f0a40e0aaea6d1833d3439ad02d99a99ee1b434c))
* hook regex to identify archive command ([b9c0ac8](https://github.com/eshraw/open-product-primer/commit/b9c0ac8b32da9ba3167ac843a8161fbbbafeadae))

## [0.7.1](https://github.com/eshraw/open-product-primer/compare/cli-v0.7.0...cli-v0.7.1) (2026-06-09)


### Bug Fixes

* missing sequencing script ([dad3c4e](https://github.com/eshraw/open-product-primer/commit/dad3c4eb89b0af672201d2a718b7e31093ab9f89))

## [0.7.0](https://github.com/eshraw/open-product-primer/compare/cli-v0.6.0...cli-v0.7.0) (2026-06-05)


### Features

* surface product decision proactively ([5bc0f10](https://github.com/eshraw/open-product-primer/commit/5bc0f1096a8fa0e4ed88a979ad5744c75a0fda99))

## [0.6.0](https://github.com/eshraw/open-product-primer/compare/cli-v0.5.0...cli-v0.6.0) (2026-06-05)


### Features

* 010 rename primer dir to oprim dir ([8bdd4c7](https://github.com/eshraw/open-product-primer/commit/8bdd4c7d7b031cf1288d711c2af33a0d0f625e9a))
* add cdex and gemini support ([cd6437c](https://github.com/eshraw/open-product-primer/commit/cd6437c2f79a6312507f4601f05ee406af2e89db))
* add new commands for OPRIM artifact creation, including bet, criteria, PDR, and review workflows with guided prompts and automatic ID assignment ([e1fc987](https://github.com/eshraw/open-product-primer/commit/e1fc9873e0b4311ddbb18bd0ba17eedbc3dda244))
* bet 001 add discovery sdt up in bnet ([641a0a2](https://github.com/eshraw/open-product-primer/commit/641a0a28faa388b8865f179d6c1bfacaca31db40))
* bet 003 reduce surface to limite ui duplication when calling skills and commands ([77faa83](https://github.com/eshraw/open-product-primer/commit/77faa83b31d20faec754b1bc538b89631bd3d422))
* bet 009 archive past bet ([f5a6e9e](https://github.com/eshraw/open-product-primer/commit/f5a6e9e83d079dfaca1d5740d7f167839520b2ce))
* bet-008 better naming ([f9d8509](https://github.com/eshraw/open-product-primer/commit/f9d8509dd6efd7697467e9558f2988b279296ab2))
* consolidate branding to 'oprim' in CLI and documentation ([ebeae28](https://github.com/eshraw/open-product-primer/commit/ebeae28e94e4d7e147700090c9b3d0cbb7da2c1b))
* enhance agent selection and configuration management in OPRIM CLI; implement agent installation logic, config persistence, and validation checks ([46310a9](https://github.com/eshraw/open-product-primer/commit/46310a91b70d11b457dcca092f4ab447c6b1bc27))
* implement `oprim measure` command for automated KPI measurement generation and execution; integrate Amplitude and BigQuery APIs, enhance review process with auto-populated results ([f1869e1](https://github.com/eshraw/open-product-primer/commit/f1869e1122503f5646594245fe16ceccf37e92c4))
* implement Open Product Primer CLI with initialization, update, and health check commands; add documentation and templates for product decisions, sequencing, and KPI tracking ([94e9584](https://github.com/eshraw/open-product-primer/commit/94e958439ea033d0bab9ed46ef62e48d98ab0b52))
* iteration on bet 009 and archiving ([c234118](https://github.com/eshraw/open-product-primer/commit/c234118beda4dad00607c0202a014b26658ae9a0))
* remove archived bet checks from oprim doctor ([0f8dafc](https://github.com/eshraw/open-product-primer/commit/0f8dafcdc0a2dc96f4ae253f41354a7cbf57d451))


### Bug Fixes

* change pattern to identify next bet ([47b3708](https://github.com/eshraw/open-product-primer/commit/47b3708fcaaec0274b8968a5fdec15dd1763cea6))
* init workflow not picking up agent, add detection ([336c63a](https://github.com/eshraw/open-product-primer/commit/336c63a99f80726979e52320e482df0660f27876))
* mock @inquirer/prompts in integration tests to prevent prompt timeout ([a84488d](https://github.com/eshraw/open-product-primer/commit/a84488de438e224f6c2f73280f6687186c70a40b))
* openspec propose invocation ([3039c67](https://github.com/eshraw/open-product-primer/commit/3039c673fa63523881fdf03160d96ab62f3f6425))
* package publishing prerequisites ([2c5f7ae](https://github.com/eshraw/open-product-primer/commit/2c5f7ae05ef6a51db89b9b484d854a900f0fd9f3))
* promote using wrong prefix, moved to bet-xxx prefix ([9aa0cda](https://github.com/eshraw/open-product-primer/commit/9aa0cda32793700abef8cc68454679816caeb98a))
* test fails ([659ccad](https://github.com/eshraw/open-product-primer/commit/659ccad0ab7173f6f1d1f1bd58113bfbbf732179))

## [0.5.0] - 2026-06-05

### Added

- **Codex support** — `oprim init` and `oprim update` now install oprim workflow instructions for OpenAI Codex by appending a delimited `## oprim workflows` section to `AGENTS.md` (created if absent); all five workflows inlined: bet, criteria, pdr, review, archive
- **Gemini CLI support** — same installation mechanism for Gemini CLI, targeting `GEMINI.md`
- `detectAvailableAgents()` now detects Codex (`AGENTS.md` present) and Gemini CLI (`GEMINI.md` present) and auto-checks them in the `oprim init` agent selection prompt
- `writeAgentInstructionFile()` helper — idempotent section writer using `<!-- oprim:start -->`/`<!-- oprim:end -->` delimiters; appends on first install, replaces on re-run without touching surrounding content
- `--agent codex` and `--agent gemini` are now valid values for the `oprim init --agent` flag

### Changed

- Agent selection prompt now lists four options: Claude Code, Cursor, Codex, Gemini CLI
- `SUPPORTED_AGENTS` expanded from `['claude', 'cursor']` to `['claude', 'cursor', 'codex', 'gemini']`

[0.5.0]: https://github.com/eshraw/open-product-primer/releases/tag/v0.5.0

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
