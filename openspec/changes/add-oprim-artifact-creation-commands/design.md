## Context

Open Product Primer currently provides `primer/templates/` with ready-to-use markdown and YAML stubs, but getting from blank template to filled artifact requires manual steps: pick the right template, copy it to the right path, assign the next ID, fill in fields, and (for bets) also update `sequence.yaml`. Every new PDR, bet, criteria contract, and KPI review follows this same friction pattern.

The four new commands — `/oprim:pdr`, `/oprim:bet`, `/oprim:criteria`, `/oprim:review` — are agent-driven workflows that replace the copy-paste loop with a guided conversation that writes the artifact directly.

The existing `oprim update` command already writes command files to `.claude/commands/oprim/` and `.cursor/commands/`. These four new commands follow the same distribution model.

## Goals / Non-Goals

**Goals:**
- Provide agent commands that scaffold and populate all four primer artifact types.
- Auto-assign sequential IDs (PDR-NNN, BET-NNN) by scanning existing files.
- Keep each command self-contained: read context, ask focused questions, write file(s), report what was created.
- `/oprim:bet` atomically creates the bet directory AND adds a `backlog` entry to `sequence.yaml`.
- `/oprim:criteria` accepts Amplitude or BigQuery source types and emits valid `criteria.yaml` structure.
- `/oprim:review` pre-fills from `criteria.yaml` so the reviewer only needs to supply actuals.

**Non-Goals:**
- Automated measurement execution (actuals are entered by the user, not fetched automatically).
- GUI or web interface — commands are agent-only.
- Editing or deleting existing artifacts (create-only for this change; updates are manual or a future command).
- Full validation of Amplitude event names or BigQuery table paths.

## Decisions

### 1) Skill files + thin command wrappers, not monolithic command files

- **Decision**: Each command is implemented as a **skill file** (`.claude/skills/oprim-<name>/SKILL.md`, `.cursor/skills/oprim-<name>/SKILL.md`) containing the complete step-by-step playbook, plus a **thin command wrapper** (`.claude/commands/oprim/<name>.md`, `.cursor/commands/oprim-<name>.md`) that surfaces the command in the palette and delegates to the skill.
- **Rationale**: A monolithic command file leaves the runtime agent to infer file patterns, YAML schemas, and write protocols — producing inconsistent output across invocations. Skill files are the right place for executable specifications: they are versioned, distributable via `oprim update`, and separate the "what to invoke" (command) from the "how to execute" (skill). This matches the existing opsx pattern (`.claude/commands/opsx/apply.md` + `.claude/skills/openspec-apply-change/SKILL.md`).
- **Alternative considered**: Single command files with all detail inline.
  - Rejected: bloats the command palette entry, makes the logic hard to maintain, and still leaves the runtime agent without machine-readable contracts for schemas and file paths.
- **Alternative considered**: Add `oprim new-pdr`, `oprim new-bet` etc. as CLI subcommands.
  - Rejected: duplicates the agent's natural-language capability and requires building an interactive CLI interface.

### 2) ID assignment by filesystem scan

- **Decision**: Each command scans the relevant directory (`primer/decisions/` for PDRs, `primer/bets/` for bets) to find the highest existing ID number, then assigns next = max + 1.
- **Rationale**: No central counter to maintain; works offline and in parallel branches.
- **Alternative considered**: Central counter in `primer/config.yaml`.
  - Rejected: adds a merge-conflict surface for a trivial problem.

### 3) `/oprim:bet` writes to `sequence.yaml` atomically

- **Decision**: After writing `bet-decision.md`, the command appends the new bet to the `backlog` list in `primer/sequence.yaml`.
- **Rationale**: A bet that exists but isn't on the board is invisible to `/oprim:sequence` validation. Default placement is `backlog` — the user moves it to `next`/`now` explicitly.
- **Alternative considered**: Leave `sequence.yaml` updates to the user.
  - Rejected: creating a bet without board placement causes silent inconsistency.

### 4) `/oprim:criteria` is additive — one metric at a time or batch

- **Decision**: The command accepts either a single metric (prompted interactively) or a batch description and writes a complete `criteria.yaml`. If a file already exists, it appends the new metric.
- **Rationale**: Criteria are often added incrementally as measurement plans solidify.
- **Alternative considered**: Always overwrite.
  - Rejected: overwrites prior criteria already authored for the same bet.

### 5) `/oprim:review` pre-fills from criteria contract

- **Decision**: The command reads `primer/bets/BET-XXX/criteria.yaml`, pre-fills the review table with baseline and target values, then asks the user for actuals only.
- **Rationale**: Prevents transcription errors and makes review creation fast even for bets with many metrics.
- **Alternative considered**: Blank review form with no pre-fill.
  - Rejected: reviewer must look up criteria manually, inviting copy errors.

## Exact Mechanics

Skill files MUST implement these contracts verbatim. They are not guidelines — they define the exact behaviour the runtime agent must reproduce.

### ID scanning

**PDR IDs**
- Scan: list files in `primer/decisions/` matching regex `PDR-(\d+)-`
- Extract: all captured integers
- Assign: `max(extracted) + 1`, zero-padded to 3 digits (e.g. `007`, `042`)
- If no files match: assign `001`
- Output path: `primer/decisions/PDR-NNN-<kebab-slug>.md` where slug = title lowercased, spaces → hyphens, non-alphanumeric removed

**BET IDs**
- Scan: list directories in `primer/bets/` matching regex `BET-(\d+)$`
- Extract: all captured integers
- Assign: `max(extracted) + 1`, zero-padded to 3 digits
- If no directories match: assign `001`
- Output path: `primer/bets/BET-NNN/bet-decision.md`

### sequence.yaml entry format

Each new bet appended to `backlog` MUST use this exact structure:

```yaml
- id: BET-NNN
  title: "<title>"
  blocked_by: []
  unlocks: []
  requires_pdrs: []
```

Write protocol: read `primer/sequence.yaml` → parse YAML → append entry to `backlog` list → write back with consistent 2-space indentation.

### criteria.yaml schema

Full file structure:

```yaml
metrics:
  - id: <snake_case_id>
    name: "<Human readable name>"
    baseline: <float>
    target: <float>
    timeframe: "<N days post-launch>"
    launch_date: "YYYY-MM-DD"
    source:
      type: amplitude | bigquery
      definition: <see source blocks below>
    segment: <string | null>
```

**Amplitude source block:**

```yaml
source:
  type: amplitude
  definition:
    event: <event_name>
    aggregation: unique_users | event_count | property_sum
    denominator_event: <event_name | null>
```

**BigQuery source block:**

```yaml
source:
  type: bigquery
  definition:
    table: "<project.dataset.table>"
    metric_column: "<column_name>"
    filter: "<sql_filter_expression>"
    aggregation: sum | count | count_distinct | avg
    denominator_query: <sql_string | null>
```

Append protocol: if `criteria.yaml` exists, read → parse YAML → append to `metrics` list → write back. Never overwrite the file.

### PDR supersession protocol

When superseding PDR-NNN with new PDR-MMM:
1. In the **new** PDR file: set `Supersedes: PDR-NNN` in the `## Related` section
2. In the **existing** PDR file: replace its `Status` line value with `Superseded by PDR-MMM`

Both files must be updated atomically in the same response.

### KPI review status logic

For each metric in the review table:

| Condition | Status field value |
|-----------|-------------------|
| `actual >= target` | `hit` |
| `actual < target` | `missed` |
| actual not provided | `pending` |

Review output path: `primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md` where date = today's date.

### Skill file structure

Each skill file MUST follow this frontmatter format (matching existing skills in `.claude/skills/`):

```markdown
---
name: oprim-<name>
description: <one-line description>
---

<step-by-step playbook content>
```

### Thin command wrapper format

Claude command wrapper (`.claude/commands/oprim/<name>.md`):

```markdown
---
name: "OPRIM: <Name>"
description: <one-line description>
category: Workflow
tags: [workflow, primer]
---

<one-sentence description of what the command does>

Use the Skill tool to invoke the `oprim-<name>` skill.
```

Cursor command wrapper (`.cursor/commands/oprim-<name>.md`) contains the full skill content inline — Cursor has no Skill tool.

## Risks / Trade-offs

- **Risk**: ID collision when two branches each create BET-042.
  → Mitigation: treat ID as a suggestion; rename on merge if collision occurs. IDs are human-assigned labels, not database keys.
- **Risk**: `sequence.yaml` YAML parsing failures if file is hand-edited with non-standard formatting.
  → Mitigation: agent reads and re-writes with consistent formatting; add a note in the command to run `oprim doctor` if issues appear.
- **Risk**: `criteria.yaml` for a bet may not exist when `/oprim:review` is called.
  → Mitigation: command detects absence and either prompts for manual metric entry or advises the user to run `/oprim:criteria` first.
