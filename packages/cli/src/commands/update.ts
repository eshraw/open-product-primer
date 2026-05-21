import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { writeFile } from '../lib/scaffold';

export function updateCommand(): Command {
  return new Command('update')
    .description('Refresh /oprim:* assistant commands and skills from package templates')
    .action(() => {
      const projectRoot = process.cwd();
      let updated = 0;

      if (fs.existsSync(path.join(projectRoot, '.claude'))) {
        // Skill files (full playbooks)
        const claudeSkillsBase = path.join(projectRoot, '.claude', 'skills');
        for (const [name, content] of Object.entries(CLAUDE_SKILLS)) {
          writeFile(path.join(claudeSkillsBase, name, 'SKILL.md'), content);
          console.log(chalk.green('✓') + ` .claude/skills/${name}/SKILL.md`);
          updated++;
        }
        // Command wrappers (thin entry points)
        const claudeCmdsDir = path.join(projectRoot, '.claude', 'commands', 'oprim');
        for (const [filename, content] of Object.entries(CLAUDE_COMMANDS)) {
          writeFile(path.join(claudeCmdsDir, filename), content);
          console.log(chalk.green('✓') + ` .claude/commands/oprim/${filename}`);
          updated++;
        }
      }

      if (fs.existsSync(path.join(projectRoot, '.cursor'))) {
        // Skill files
        const cursorSkillsBase = path.join(projectRoot, '.cursor', 'skills');
        for (const [name, content] of Object.entries(CURSOR_SKILLS)) {
          writeFile(path.join(cursorSkillsBase, name, 'SKILL.md'), content);
          console.log(chalk.green('✓') + ` .cursor/skills/${name}/SKILL.md`);
          updated++;
        }
        // Command files (full inline for Cursor — no Skill tool)
        const cursorCmdsDir = path.join(projectRoot, '.cursor', 'commands');
        for (const [filename, content] of Object.entries(CURSOR_COMMANDS)) {
          writeFile(path.join(cursorCmdsDir, filename), content);
          console.log(chalk.green('✓') + ` .cursor/commands/${filename}`);
          updated++;
        }
      }

      if (updated === 0) {
        console.log(chalk.yellow('No assistant environments detected (.claude/, .cursor/).'));
        console.log('Run this command from a repository where AI tools are configured.');
      } else {
        console.log(`\n${updated} file(s) updated.`);
      }
    });
}

// ─── Claude skill playbooks ───────────────────────────────────────────────────

const CLAUDE_SKILLS: Record<string, string> = {
  'oprim-pdr': pdrSkill(),
  'oprim-bet': betSkill(),
  'oprim-criteria': criteriaSkill(),
  'oprim-review': reviewSkill(),
};

// ─── Claude command wrappers (thin, invoke skill) ────────────────────────────

const CLAUDE_COMMANDS: Record<string, string> = {
  'promote.md': claudeWrapper('OPRIM: Promote', 'Promote a prioritized bet to an OpenSpec change', promoteContent()),
  'sequence.md': claudeWrapper('OPRIM: Sequence', 'Validate and update the primer sequencing board', sequenceContent()),
  'pdr.md': claudeWrapper('OPRIM: PDR', 'Create a new Product Decision Record with auto-assigned ID', 'Use the Skill tool to invoke the `oprim-pdr` skill.'),
  'bet.md': claudeWrapper('OPRIM: Bet', 'Create a new bet decision and register it on the sequencing board', 'Use the Skill tool to invoke the `oprim-bet` skill.'),
  'criteria.md': claudeWrapper('OPRIM: Criteria', 'Create or append to a criteria.yaml contract for a bet', 'Use the Skill tool to invoke the `oprim-criteria` skill.'),
  'review.md': claudeWrapper('OPRIM: Review', 'Create a KPI review artifact pre-filled from a bet\'s criteria contract', 'Use the Skill tool to invoke the `oprim-review` skill.'),
};

// ─── Cursor skill playbooks (identical to Claude skills) ─────────────────────

const CURSOR_SKILLS: Record<string, string> = {
  'oprim-pdr': pdrSkill(),
  'oprim-bet': betSkill(),
  'oprim-criteria': criteriaSkill(),
  'oprim-review': reviewSkill(),
};

// ─── Cursor command files (full inline — no Skill tool in Cursor) ────────────

const CURSOR_COMMANDS: Record<string, string> = {
  'oprim-promote.md': cursorWrapper('oprim-promote', 'Promote a prioritized bet to an OpenSpec change', promoteContent()),
  'oprim-sequence.md': cursorWrapper('oprim-sequence', 'Validate and update the primer sequencing board', sequenceContent()),
  'oprim-pdr.md': cursorWrapper('oprim-pdr', 'Create a new Product Decision Record with auto-assigned ID', pdrInlineContent()),
  'oprim-bet.md': cursorWrapper('oprim-bet', 'Create a new bet decision and register it on the sequencing board', betInlineContent()),
  'oprim-criteria.md': cursorWrapper('oprim-criteria', 'Create or append to a criteria.yaml contract for a bet', criteriaInlineContent()),
  'oprim-review.md': cursorWrapper('oprim-review', 'Create a KPI review artifact pre-filled from a bet\'s criteria contract', reviewInlineContent()),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function claudeWrapper(name: string, description: string, body: string): string {
  return `---
name: "${name}"
description: ${description}
category: Workflow
tags: [workflow, primer]
---

${description}.

${body}`;
}

function cursorWrapper(id: string, description: string, body: string): string {
  return `---
name: /${id}
id: ${id}
category: Workflow
description: ${description}
---

${body}`;
}

// ─── Skill content ────────────────────────────────────────────────────────────

function pdrSkill(): string {
  return `---
name: oprim-pdr
description: Create a new Product Decision Record in primer/decisions/ with auto-assigned ID and guided prompting
---

Create a new Product Decision Record (PDR) in \`primer/decisions/\`.

## Steps

### 1. Get the decision title
If not provided, ask: "What is the title of this product decision?"

### 2. Assign the next PDR ID
Scan \`primer/decisions/\` for files matching \`PDR-(\\d+)-\`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default \`001\` if none found.
Slug: title → lowercase → spaces to hyphens → remove non-alphanumeric (except hyphens).
Output path: \`primer/decisions/PDR-NNN-<slug>.md\`

### 3. Gather content
Ask: Context (what forced this decision), Decision (clear statement), Alternatives considered (why rejected), Consequences (positives / trade-offs / follow-ups), Evidence links (optional), Related bets (optional), Related OpenSpec changes (optional).

### 4. Check for supersession
Ask: "Does this supersede an existing PDR? If so, which ID? (Enter to skip)"

### 5. Write the PDR file
\`\`\`
# PDR-NNN: <title>

## Status
Proposed

## Context
<context>

## Decision
<decision>

## Alternatives considered
<alternatives as bullet list>

## Consequences
- Positive: <...>
- Trade-offs: <...>
- Follow-ups: <...>

## Evidence
<evidence or "None">

## Related
- Bets: <BET-IDs or "None">
- OpenSpec: <change paths or "None">
- Supersedes: <PDR-ID or "None">
\`\`\`

### 6. Update superseded PDR (if applicable)
Read the superseded file → replace Status value with \`Superseded by PDR-NNN\` → write back.

### 7. Report what was created
`;
}

function betSkill(): string {
  return `---
name: oprim-bet
description: Create a new bet directory and bet-decision artifact in primer/bets/, and add the bet to primer/sequence.yaml backlog
---

Create a new bet in \`primer/bets/\` and register it on the sequencing board.

## Steps

### 1. Get the bet title
If not provided, ask: "What is the title of this bet?"

### 2. Assign the next BET ID
Scan \`primer/bets/\` for directories matching \`BET-(\\d+)$\`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default \`001\` if none.

### 3. Check sequence.yaml exists
If \`primer/sequence.yaml\` not found: report and stop — advise \`oprim init\`.

### 4. Gather content
Ask: Decision (Build now / Defer / Kill, default Build now), Owner, Review date (YYYY-MM-DD), Why now, Alternatives considered, Expected outcomes (metric: baseline → target in timeframe), Kill criteria / rollback trigger, PDR links (optional).

### 5. Write primer/bets/BET-NNN/bet-decision.md
\`\`\`
# Decision: BET-NNN <title>

## Status
- Decision: <decision>
- Date: <today YYYY-MM-DD>
- Owner: <owner>
- Review date: <review date>

## Why now
<why-now as bullet list>

## Alternatives considered
<alternatives as bullet list>

## Expected outcomes
<outcomes as bullet list>

## Kill criteria / rollback trigger
<kill criteria as bullet list>

## Links
- PDRs: <PDR-IDs or "None">
- OpenSpec change: <to be filled when promoted>
\`\`\`

### 6. Append to primer/sequence.yaml backlog
Read → parse YAML → append → write back (2-space indentation):
\`\`\`yaml
- id: BET-NNN
  title: "<title>"
  blocked_by: []
  unlocks: []
  requires_pdrs: []
\`\`\`

### 7. Report what was created
`;
}

function criteriaSkill(): string {
  return `---
name: oprim-criteria
description: Create or append to a criteria.yaml contract for a bet, with structured Amplitude and BigQuery source mapping
---

Create or append to \`primer/bets/BET-NNN/criteria.yaml\`.

## Steps

### 1. Identify the bet
If not provided, ask: "Which bet are you adding criteria for? (e.g. BET-042)"

### 2. Verify bet exists
If \`primer/bets/BET-NNN/\` not found: report and stop — advise \`/oprim:bet\` first.

### 3. Gather metric details
Ask: metric ID (snake_case), metric name, baseline (numeric), target (numeric), timeframe, launch date (YYYY-MM-DD or TBD), segment (optional).

### 4. Gather source mapping
Ask: source type (amplitude / bigquery)

If amplitude: event name, aggregation (unique_users / event_count / property_sum), denominator event (optional).
\`\`\`yaml
source:
  type: amplitude
  definition:
    event: <event_name>
    aggregation: <aggregation>
    denominator_event: <event_name | null>
\`\`\`

If bigquery: table, metric column, SQL filter, aggregation (sum / count / count_distinct / avg), denominator query (optional).
\`\`\`yaml
source:
  type: bigquery
  definition:
    table: "<project.dataset.table>"
    metric_column: "<column>"
    filter: "<sql_filter>"
    aggregation: <aggregation>
    denominator_query: <sql | null>
\`\`\`

### 5. Build metric entry and write
If file exists: read → parse → append to \`metrics\` → write back (never overwrite).
If not: create with \`metrics:\` list.

### 6. Ask if more metrics needed. If yes, return to step 3.

### 7. Report what was created
`;
}

function reviewSkill(): string {
  return `---
name: oprim-review
description: Create a KPI review artifact for a completed bet, pre-filled from criteria.yaml with actuals gathered from the user
---

Create a KPI review in \`primer/reviews/\`.

## Steps

### 1. Identify the bet
If not provided, ask: "Which bet are you reviewing? (e.g. BET-042)"

### 2. Load criteria for pre-fill
Read \`primer/bets/BET-NNN/criteria.yaml\` if it exists (pre-fills baseline and target).
If not found: inform user and continue with empty metrics list.

### 3. Gather actuals per metric
For each metric show name/baseline/target and ask: "What was the actual result? (number or 'pending')"

Status logic:
- actual >= target → \`hit\`
- actual < target → \`missed\`
- 'pending' or not provided → \`pending\`

### 4. Get review metadata
Ask: reviewer name, decision quality notes.

### 5. Output path
\`primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md\` (today's date)

### 6. Write the review file
\`\`\`markdown
# KPI Review: BET-NNN

**Review date:** YYYY-MM-DD
**Reviewed by:** <reviewer>

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| <name> | <baseline> | <target> | <actual> | <status> |

## Decision quality
<notes>

## Actions
- [ ] Update bet-decision outcome section
- [ ] Update affected PDRs
- [ ] Re-sequence impacted bets
\`\`\`

### 7. Report what was created
`;
}

// ─── Cursor inline content (condensed versions for command files) ─────────────

function pdrInlineContent(): string {
  return `Create a new PDR in \`primer/decisions/\`. Scan for \`PDR-(\\d+)-\` to assign next ID (zero-padded, default 001). Gather: title, context, decision, alternatives, consequences, evidence, related bets/specs. Ask if superseding an existing PDR. Write \`primer/decisions/PDR-NNN-<slug>.md\`. If superseding: update old PDR Status to "Superseded by PDR-NNN". Report what was created.`;
}

function betInlineContent(): string {
  return `Create a new bet in \`primer/bets/\`. Scan \`BET-(\\d+)$\` dirs for next ID (zero-padded, default 001). Check \`primer/sequence.yaml\` exists (stop if not — advise oprim init). Gather: title, decision (default Build now), owner, review date, why-now, alternatives, expected outcomes, kill criteria, PDR links. Write \`primer/bets/BET-NNN/bet-decision.md\`. Append entry to sequence.yaml backlog: \`{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}\`. Report what was created.`;
}

function criteriaInlineContent(): string {
  return `Add metrics to \`primer/bets/BET-NNN/criteria.yaml\`. Verify bet dir exists. Gather: metric ID, name, baseline, target, timeframe, launch date, segment. Ask source type (amplitude or bigquery). Amplitude: event, aggregation, denominator_event. BigQuery: table, metric_column, filter, aggregation, denominator_query. If file exists: append to metrics list (never overwrite). If not: create. Ask if adding more metrics. Report what was created.`;
}

function reviewInlineContent(): string {
  return `Create KPI review in \`primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md\`. Read \`criteria.yaml\` for pre-fill (baseline/target). For each metric ask actual value. Status: actual >= target → hit, actual < target → missed, not provided → pending. Ask reviewer name and decision quality notes. Write review with metric table and Actions checklist. Report what was created.`;
}

// ─── Legacy content (promote / sequence remain inline) ───────────────────────

function promoteContent(): string {
  return `
Promote a prioritized bet to an OpenSpec change and link criteria contracts.

**Input**: Specify a bet ID (e.g., \`/oprim:promote BET-042\`) or omit to be prompted.

**Steps**

1. **Locate the bet** — read \`primer/bets/BET-XXX/bet-decision.md\`
2. **Validate status** — decision must be "Build now"
3. **Check authority boundary** — confirm primer artifact owns why/order/outcome only
4. **Create OpenSpec change** — run \`openspec propose <change-name>\` or create change directory
5. **Link artifacts**:
   - Add OpenSpec change path to bet-decision \`## Links\` section
   - Add bet ID to OpenSpec proposal context
6. **Copy criteria** — if \`primer/bets/BET-XXX/criteria.yaml\` exists, link it from OpenSpec proposal
7. **Report** — show what was linked and what remains for engineering
`;
}

function sequenceContent(): string {
  return `
Validate the primer sequencing board and suggest rebalancing if needed.

**Steps**

1. **Read board** — load \`primer/sequence.yaml\`
2. **Check WIP limits** — compare \`now\` count against \`wip_limits.now\`
3. **Validate blockers** — for each bet in \`now\`, confirm all \`blocked_by\` entries are complete or absent
4. **Validate PDR preconditions** — confirm all \`requires_pdrs\` entries exist in \`primer/decisions/\`
5. **Report violations** — list any WIP excess, unresolved blockers, or missing PDRs
6. **Suggest moves** — recommend bets to defer to \`next\` or \`later\` to resolve violations
`;
}
