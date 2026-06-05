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
- **`commands/`** — one file per CLI subcommand (`init`, `update`, `doctor`, `migrate`, `measure`)
- **`lib/detect.ts`** — detects OpenSpec, Graphify, and AI agent environments (`.claude/`, `.cursor/`, `AGENTS.md`, `GEMINI.md`)
- **`lib/install-agent.ts`** — the largest file; owns all skill/command content as string literals and writes them to agent directories. Supports `claude`, `cursor`, `codex`, `gemini`. Claude gets skills + command wrappers + hooks; Codex/Gemini get inline workflow text written into `AGENTS.md`/`GEMINI.md` between `<!-- oprim:start -->` / `<!-- oprim:end -->` delimiters; Cursor gets full inline command files
- **`lib/scaffold.ts`** — thin filesystem helpers (`ensureDir`, `writeFile`, `writeFileIfAbsent`)
- **`lib/templates.ts`** — YAML/Markdown template strings for the `oprim/` workspace files
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

### Agent detection

`detectAvailableAgents()` checks for: `.claude/` → `claude`, `.cursor/` → `cursor`, `AGENTS.md` → `codex`, `GEMINI.md` → `gemini`. This drives which agents are pre-checked in the interactive `oprim init` prompt.
