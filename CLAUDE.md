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
node dist/cli.js validate
```

Releases publish automatically via GitHub Actions when a `v*` tag is pushed to `main`.

### `oprim validate`

A standalone, CI-runnable counterpart to `oprim doctor`: it aggregates sequence-integrity, skill-version-drift, bet definition-of-done, spec-delta drift, and cross-bet conflict checks into one report and exits non-zero when a check fails, so a team can gate a merge or release on it (`doctor` never sets a non-zero exit code).

```bash
oprim validate                    # human-readable report; exits non-zero only on a required check failure
oprim validate --json             # print { "checks": [...] } instead of the human-readable report
oprim validate --strict           # exit non-zero on ANY failing check, not only required ones
oprim validate --diff <BET-ID>    # preview a bet's specs/<capability>/spec.md delta folded into
                                   # oprim/specs/<capability>/spec.md, without writing any files
```

Suggested CI usage (e.g. a GitHub Actions step gating a PR merge):
```yaml
- name: Validate oprim workspace
  run: npx oprim validate --strict --json
```

## Architecture

This repo is itself an `oprim`-managed project — the `oprim/` workspace and `.claude/` configs here are live data produced by the tool.

### Source layout (`packages/cli/src/`)

- **`cli.ts`** — Commander entrypoint; registers all subcommands
- **`commands/`** — one file per CLI subcommand (`init`, `update`, `doctor`, `validate`, `migrate`, `measure`, `ovw`, `context`)
- **`lib/detect.ts`** — detects OpenSpec, Graphify, and AI agent environments (`.claude/`, `.cursor/`, `AGENTS.md`, `GEMINI.md`, `.poolside/`, `.vibe/`, `.qwen/`)
- **`lib/install-agent.ts`** — orchestrates which files get written to which agent directories (hooks, tombstone cleanup, PDR-surfacing Step 0 injection); the workflow *content* itself now lives in `workflow-schema.ts`/`workflow-renderer.ts`/`workflows/*` (see below). Supports `claude`, `cursor`, `codex`, `gemini`, `poolside`, `vibe`, `qwen`. Claude gets skills + command wrappers + hooks; Poolside, Mistral Vibe, and Qwen Code get skills + an `AGENTS.md`-style instruction file (Vibe's `vibe.skill` and Qwen's `qwen.skill` schema gates default to mirroring `poolside.skill` when a workflow's schema declares no `vibe:`/`qwen:` key, so bundled/forked schemas don't need a new key to keep working); Codex/Gemini get inline workflow text written into `AGENTS.md`/`GEMINI.md` between `<!-- oprim:start -->` / `<!-- oprim:end -->` delimiters; Cursor gets full inline command files
- **`lib/workflow-schema.ts`** — loads a workflow's `<id>.schema.yaml` + `<id>.template.md`, resolving a project-level `oprim/workflows/<id>.{schema.yaml,template.md}` override over the CLI-bundled default (independently per file); throws an actionable, file-naming error on a malformed override rather than silently falling back
- **`lib/workflow-renderer.ts`** — renders a resolved schema+template pair into each agent's output shape: Claude skill body / thin command wrapper, Cursor skill body / condensed inline command, and the shared Codex/Gemini/Poolside/Vibe inline instruction block
- **`workflows/`** — one `<id>.schema.yaml` + `<id>.template.md` pair per oprim workflow (`bet`, `pdr`, `note`, `criteria`, `review`, `archive`, `sequence`, `context`, `spec-authoring`, `promote`), plus bundled, non-overridable variant files (`<id>.cursor-command.md`, `<id>.inline.md`, and `promote.<framework>.template.md`) that back the condensed Cursor/Codex/Gemini/Poolside/Vibe renderings. Copied into `dist/workflows/` at build time by `scripts/copy-workflow-assets.js` (tsc does not copy non-`.ts` files)
- **`lib/scaffold.ts`** — thin filesystem helpers (`ensureDir`, `writeFile`, `writeFileIfAbsent`)
- **`lib/templates.ts`** — YAML/Markdown template strings for the `oprim/` workspace files, including `configTemplate()` for `oprim/config.yaml`
- **`lib/config-merge.ts`** — additive, non-destructive merge of new `oprim/config.yaml` schema keys (`context`, `rules`, `remote_context`, `integrations.spec_framework`) into existing projects on `oprim update`; edits the raw text rather than parsing+re-dumping YAML so untouched lines are never reformatted
- **`lib/integrity.ts`** — `oprim doctor` checks for sequencing-board integrity (WIP limits, dangling `blocked_by`/`unlocks` references) and installed-Claude-skill version drift against the bundled `install-agent.ts` content; reused as-is by `oprim validate`
- **`lib/spec-delta.ts`** — `foldDelta()` (ADDED-append / MODIFIED-replace / REMOVED-delete, matching `### Requirement:` headers whitespace-insensitively) and `findCrossBetConflicts()` (overlapping requirement headers across active bets' deltas), extracted out of `/oprim:archive`'s prose (`workflows/archive.template.md`) into shared, testable TypeScript that `oprim validate` calls deterministically; also `resolveBetDirectory()`/`normalizeBetId()`, the same bet-ID-to-directory resolution `/oprim:archive` describes
- **`lib/validate-checks.ts`** — the checks unique to `oprim validate` (not shared with `doctor`): `checkBetDefinitionOfDone()` (a promoted bet — one whose `bet-decision.md` links a non-placeholder OpenSpec change — must have a `criteria.yaml`), `checkSpecDeltaDrift()` (a bet's MODIFIED/REMOVED delta requirement must still header-match `oprim/specs/<capability>/spec.md`), and `checkCrossBetConflicts()` (wraps `spec-delta.ts`'s `findCrossBetConflicts()` into `Check[]` entries)
- **`lib/remote-context.ts`** — resolves `remote_context.sources` entries (git or local path) declared in `oprim/config.yaml`; git sources are cloned into a throttled cache at `~/.oprim/remote-context-cache/` (identity-only sparse clone vs. full clone, see below)
- **`lib/measure.ts`** — Amplitude and BigQuery metric fetching for the `measure` subcommand
- **`__tests__/`** — Vitest tests using real temp directories (no mocking of the filesystem)

### Key design: skills as declarative schema + template pairs

Each `/oprim:*` workflow's content is a `<id>.schema.yaml` (metadata: `skillName`, `title`, `description`, per-agent targets) + `<id>.template.md` (the instructional body) pair under `packages/cli/src/workflows/`. `oprim update` re-renders them via `workflow-renderer.ts` and overwrites the installed files in the target agent directories. This means the source of truth for a workflow's wording is `workflows/<id>.template.md`, not the installed files in `.claude/skills/` — and, unlike the old string-literal-function design, a project can fork a single workflow without touching CLI TypeScript at all (see "Forking a workflow" below).

#### Forking a workflow

Drop `oprim/workflows/<id>.schema.yaml` and/or `oprim/workflows/<id>.template.md` into your own repo (matching a bundled workflow id — see the list in `workflows/` above). Either file alone is enough; the other falls back to the CLI-bundled default. The next `oprim update` renders your fork for every installed agent instead of the bundled version. This only forks that one workflow — a malformed override fails loudly (naming the file) rather than silently falling back, and `oprim doctor`'s skill-drift check will (correctly) keep flagging the installed file as differing from the CLI-bundled default, since you opted into the fork.

### Claude Code hook architecture

`oprim init/update` installs two hooks in `.claude/hooks/`:
- **`on-prompt-submit.sh`** — detects when `/opsx:archive` is invoked and writes a `.archive-pending` flag file
- **`on-stop.sh`** — on session stop, reads the flag file, finds the linked bet ID from the archived OpenSpec proposal, and blocks to prompt `/oprim:archive` co-archival

Hook registration is merged into `.claude/settings.json` (does not clobber existing hooks).

### Authority boundaries

- `oprim/` owns **why / order / outcomes** (PDRs, bets, sequencing, KPI reviews)
- `openspec/changes/` owns **what / how** (proposals, designs, tasks, specs)
- The link between layers is the `/oprim:promote` command, which invokes `/opsx:propose` to create the OpenSpec change
- When the `native` speccing framework is selected (opt-in, alongside/instead of OpenSpec): `oprim/specs/<capability>/spec.md` is current truth; `oprim/bets/pending/BET-NNN.../specs/<capability>/spec.md` holds an in-flight bet's ADDED/MODIFIED/REMOVED delta until `/oprim:archive` folds it into current truth. Bets live under `oprim/bets/pending/` while active and move to `oprim/bets/archived/` on archive. A native-mode bet's first `oprim-spec` pass also scaffolds `design.md`/`tasks.md` alongside the spec delta; `/oprim:archive` warns if `tasks.md` still has unchecked items

### Remote context

A project opts into being cited by others by running `oprim context init`, which writes an identity file at `.oprim-context/context.yaml` (`name`, `version`, `description`). A *consuming* project registers that project as a source via `oprim context register --git <url>|--local <path> --name <name>`, stored under the `remote_context` block of its own `oprim/config.yaml`. `oprim context` (optionally `--source <name>`) resolves and prints each registered source's `oprim/` workspace content; `oprim context list` only resolves identity (cheap) without pulling full content. `oprim doctor` validates every registered source can still resolve. Git sources are cached under `~/.oprim/remote-context-cache/<name>-<hash>/{identity,full}/` with a 5-minute fetch throttle (`OPRIM_REMOTE_CONTEXT_THROTTLE_MS` override, cache dir override via `OPRIM_REMOTE_CONTEXT_CACHE_DIR` — both used by tests to avoid touching the real home directory); a full clone that fails after previously succeeding degrades to serving the last-known-good clone as stale rather than erroring.

### Agent detection

`detectAvailableAgents()` checks for: `.claude/` → `claude`, `.cursor/` → `cursor`, `AGENTS.md` → `codex`, `GEMINI.md` → `gemini`, `.poolside/` → `poolside`, `.vibe/` → `vibe`, `.qwen/` → `qwen`. This drives which agents are pre-checked in the interactive `oprim init` prompt.
