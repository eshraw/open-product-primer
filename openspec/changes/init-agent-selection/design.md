## Context

`oprim init` currently calls `detectOpenSpec` and `detectGraphify`, scaffolds `primer/`, and exits with a suggestion to run `oprim update`. Agent skill installation is deferred entirely to `update`, which auto-detects `.claude/` and `.cursor/` by directory presence. There is no user choice, no persistence of intent, and no single-command setup.

The CLI already uses `chalk` (ESM), `commander`, and `js-yaml`. No interactive prompt library is present.

## Goals / Non-Goals

**Goals:**
- `oprim init` asks which AI tools to install skills for, then installs them immediately
- The selection is persisted to `primer/config.yaml` under `agents:`
- `oprim update` reads `agents:` from config when present (falls back to dir detection)
- `oprim doctor` validates that config-declared agents have their directories present
- `--agent` flag enables non-interactive use: `oprim init --agent claude`

**Non-Goals:**
- Supporting agents beyond `claude` and `cursor` in this change
- Changing the `oprim update` command's interactive behavior (it remains non-interactive)
- Migrating existing `primer/config.yaml` files that lack the `agents:` field

## Decisions

### 1. Add `@inquirer/prompts` for the interactive checkbox

**Decision:** Introduce `@inquirer/prompts` (Inquirer v9+) as the prompt library for the agent selection checkbox during `init`.

**Rationale:** `chalk` v5 already requires ESM, so the project is ESM-compatible. `@inquirer/prompts` is the current standard for Node CLI prompts, is tree-shakeable, and provides a native multi-select checkbox that matches the UX pattern users expect. Using raw `readline` for multi-select would require significant boilerplate and deliver a worse UX.

**Alternative considered:** `prompts` — lighter weight, but development has slowed and it lacks active maintenance. `@inquirer/prompts` is the more future-proof choice.

**Alternative considered:** Commander's `--agent` flag only (no interactive prompt) — acceptable for scripting but poor for first-time interactive use. Both paths are provided.

### 2. Persist selection to `primer/config.yaml` under `agents:` list

**Decision:** Write the selected agents as a YAML list at `agents:` in `primer/config.yaml`.

```yaml
agents:
  - claude
  - cursor
```

**Rationale:** `primer/config.yaml` is already the source of truth for project-level configuration (OpenSpec integration, Graphify integration). Storing agent selection there keeps all oprim config in one file and makes the selection inspectable and editable by users.

**Alternative considered:** Separate `primer/.agents` file — adds file surface without benefit; config.yaml is the right home.

### 3. Reuse update's installation logic from init — don't duplicate

**Decision:** Extract the per-agent skill installation from `update.ts` into a shared `installAgentSkills(agent, projectRoot)` function. Both `init` and `update` call this function.

**Rationale:** The current `update.ts` installation logic (write skills + commands for each agent) is the correct implementation. Duplicating it in `init.ts` creates a maintenance burden. Extraction to a shared helper is the minimum refactor needed.

### 4. `oprim update` reads `agents:` from config, falls back to dir detection

**Decision:** When `primer/config.yaml` exists and has a non-empty `agents:` list, `update` installs for exactly those agents. When `agents:` is absent or empty, `update` falls back to the existing dir-detection behavior.

**Rationale:** Backwards compatibility — existing repos without `agents:` in config continue to work. New repos initialized with agent selection get deterministic update behavior.

### 5. Pre-check agent dirs during init; warn if missing, install anyway

**Decision:** If the user selects `claude` but `.claude/` doesn't exist, `init` creates the necessary subdirectories and installs the files, then emits a notice: "`.claude/` created — Claude Code will discover these files automatically."

**Rationale:** A user may be setting up a fresh repo before running any AI tool. Blocking installation because the directory isn't there yet forces an ordering that shouldn't be required.

## Risks / Trade-offs

- **ESM import in tests** → `@inquirer/prompts` is ESM-only; ensure the test runner (if added later) supports ESM or mock the prompt module at the boundary.
- **`init` now has a side effect (file writes outside `primer/`)** → Installing to `.claude/` or `.cursor/` during `init` is a larger blast radius than today. Mitigation: `--no-install` flag (see Open Questions) to opt out.
- **Re-running `init` on an existing project** → If `agents:` is already in config, `init` should show the current selection as default checked items rather than prompting from scratch. This keeps re-runs predictable.

## Open Questions

- Should re-running `init` on a repo that already has `agents:` in config skip the prompt and just re-install, or always re-prompt? Proposed default: re-install silently, matching the idempotent nature of `init`. User can edit `agents:` in config and re-run.
- Should `--no-install` be supported to scaffold `primer/` and record agent selection without writing to `.claude/`/`.cursor/`? Deferred — add if requested.
