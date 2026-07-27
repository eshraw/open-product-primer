# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All development commands run from `packages/cli/`:

```bash
cd packages/cli
npm install        # install dependencies
npm run build      # compile TypeScript → dist/
npm run dev        # watch mode
npm test           # run all tests (vitest)
npm test -- --reporter=verbose  # verbose output
npx vitest run src/__tests__/detect.test.ts  # run a single test file
```

To test the CLI locally:
```bash
node dist/cli.js init
node dist/cli.js doctor
```

Releases publish automatically via GitHub Actions when a `v*` tag is pushed to `main`.

## Architecture

This repo is itself an `oprim`-managed project — the `oprim/` workspace and `.claude/` configs here are live data produced by the tool.

### Source layout (`packages/cli/src/`)

- **`cli.ts`** — Commander entrypoint; registers all subcommands
- **`commands/`** — one file per CLI subcommand (`init`, `update`, `doctor`, `migrate`, `measure`, `ovw`, `context`)
- **`lib/detect.ts`** — detects OpenSpec, Graphify, and AI agent environments (`.claude/`, `.cursor/`, `AGENTS.md`, `GEMINI.md`, `.poolside/`)
- **`lib/install-agent.ts`** — the largest file; owns all skill/command content as string literals and writes them to agent directories. Supports `claude`, `cursor`, `codex`, `gemini`, `poolside`. Claude gets skills + command wrappers + hooks; Poolside gets skills + an `AGENTS.md`-style instruction file; Codex/Gemini get inline workflow text written into `AGENTS.md`/`GEMINI.md` between `<!-- oprim:start -->` / `<!-- oprim:end -->` delimiters; Cursor gets full inline command files
- **`lib/scaffold.ts`** — thin filesystem helpers (`ensureDir`, `writeFile`, `writeFileIfAbsent`)
- **`lib/templates.ts`** — YAML/Markdown template strings for the `oprim/` workspace files, including `configTemplate()` for `oprim/config.yaml`
- **`lib/config-merge.ts`** — additive, non-destructive merge of new `oprim/config.yaml` schema keys (`context`, `rules`, `remote_context`, `integrations.spec_framework`) into existing projects on `oprim update`; edits the raw text rather than parsing+re-dumping YAML so untouched lines are never reformatted
- **`lib/integrity.ts`** — `oprim doctor` checks for sequencing-board integrity (WIP limits, dangling `blocked_by`/`unlocks` references) and installed-Claude-skill version drift against the bundled `install-agent.ts` content
- **`lib/remote-context.ts`** — resolves `remote_context.sources` entries (git or local path) declared in `oprim/config.yaml`; git sources are cloned into a throttled cache at `~/.oprim/remote-context-cache/` (identity-only sparse clone vs. full clone, see below)
- **`lib/measure.ts`** — Amplitude and BigQuery metric fetching for the `measure` subcommand
- **`__tests__/`** — Vitest tests using real temp directories (no mocking of the filesystem)

### Key design: skills as code

All `/oprim:*` skill content lives as string constants in `install-agent.ts` (not as separate files). `oprim update` re-generates and overwrites them in the target agent directories. This means the source of truth for skill behavior is `install-agent.ts`, not the installed files in `.claude/skills/`.

### Claude Code hook architecture

`oprim init/update` installs two hooks in `.claude/hooks/`:
- **`on-prompt-submit.sh`** — detects when `/opsx:archive` is invoked and writes a `.archive-pending` flag file
- **`on-stop.sh`** — on session stop, reads the flag file, finds the linked bet ID from the archived OpenSpec proposal, and blocks to prompt `/oprim:archive` co-archival

Hook registration is merged into `.claude/settings.json` (does not clobber existing hooks).

### Authority boundaries

- `oprim/` owns **why / order / outcomes** (PDRs, bets, sequencing, KPI reviews)
- `openspec/changes/` owns **what / how** (proposals, designs, tasks, specs)
- The link between layers is the `/oprim:promote` command, which invokes `/opsx:propose` to create the OpenSpec change
- When the `native` speccing framework is selected (opt-in, alongside/instead of OpenSpec): `oprim/specs/<capability>/spec.md` is current truth; `oprim/bets/BET-NNN.../specs/<capability>/spec.md` holds an in-flight bet's ADDED/MODIFIED/REMOVED delta until `/oprim:archive` folds it into current truth

### Remote context

A project opts into being cited by others by running `oprim context init`, which writes an identity file at `.oprim-context/context.yaml` (`name`, `version`, `description`). A *consuming* project registers that project as a source via `oprim context register --git <url>|--local <path> --name <name>`, stored under the `remote_context` block of its own `oprim/config.yaml`. `oprim context` (optionally `--source <name>`) resolves and prints each registered source's `oprim/` workspace content; `oprim context list` only resolves identity (cheap) without pulling full content. `oprim doctor` validates every registered source can still resolve. Git sources are cached under `~/.oprim/remote-context-cache/<name>-<hash>/{identity,full}/` with a 5-minute fetch throttle (`OPRIM_REMOTE_CONTEXT_THROTTLE_MS` override, cache dir override via `OPRIM_REMOTE_CONTEXT_CACHE_DIR` — both used by tests to avoid touching the real home directory); a full clone that fails after previously succeeding degrades to serving the last-known-good clone as stale rather than erroring.

### Agent detection

`detectAvailableAgents()` checks for: `.claude/` → `claude`, `.cursor/` → `cursor`, `AGENTS.md` → `codex`, `GEMINI.md` → `gemini`, `.poolside/` → `poolside`. This drives which agents are pre-checked in the interactive `oprim init` prompt.
