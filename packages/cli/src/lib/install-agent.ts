import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { writeFile } from './scaffold';
import { detectAvailableAgents } from './detect';

export type Agent = 'claude' | 'cursor';
export const SUPPORTED_AGENTS: readonly Agent[] = ['claude', 'cursor'];

export async function promptFrameworkSelection(projectRoot: string): Promise<string> {
  const configPath = path.join(projectRoot, '.claude', 'hooks', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
      if (typeof existing.framework === 'string') {
        console.log(chalk.dim(`  Speccing framework: ${existing.framework} (from config)`));
        return existing.framework;
      }
    } catch {
      // fallthrough to prompt
    }
  }
  const { select } = await import('@inquirer/prompts');
  return select({
    message: 'Which speccing framework does this project use?',
    choices: [
      { name: 'OpenSpec (recommended)', value: 'openspec' },
      { name: 'None', value: 'none' },
    ],
  });
}

export async function promptAgentSelection(projectRoot: string): Promise<string[]> {
  const detected = detectAvailableAgents(projectRoot);
  if (detected.length > 0) {
    console.log(chalk.dim(`Auto-detected AI tool environments: ${detected.join(', ')}`));
  }
  console.log('');
  const { checkbox } = await import('@inquirer/prompts');
  return checkbox({
    message: 'Which AI tools should /oprim:* skills be installed for?',
    choices: [
      { name: 'Claude Code', value: 'claude', checked: detected.includes('claude') },
      { name: 'Cursor', value: 'cursor', checked: detected.includes('cursor') },
    ],
  });
}

export function installAgentSkills(agent: Agent, projectRoot: string, framework = 'openspec'): void {
  if (agent === 'claude') {
    const claudeDir = path.join(projectRoot, '.claude');
    const dirCreated = !fs.existsSync(claudeDir);

    const skillsBase = path.join(claudeDir, 'skills');
    for (const [name, content] of Object.entries(CLAUDE_SKILLS)) {
      writeFile(path.join(skillsBase, name, 'SKILL.md'), content);
      console.log(chalk.green('✓') + ` .claude/skills/${name}/SKILL.md`);
    }

    const cmdsDir = path.join(claudeDir, 'commands', 'oprim');
    for (const [filename, content] of Object.entries(CLAUDE_COMMANDS)) {
      writeFile(path.join(cmdsDir, filename), content);
      console.log(chalk.green('✓') + ` .claude/commands/oprim/${filename}`);
    }

    // Tombstone cleanup: remove command wrappers deleted in v0.2.0 (bet/criteria/pdr/review
    // became skills-only). Safe to remove this block once the user base has migrated past v0.2.0.
    const tombstones = ['bet.md', 'criteria.md', 'pdr.md', 'review.md'];
    for (const filename of tombstones) {
      const filepath = path.join(cmdsDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(chalk.dim(`  removed legacy command .claude/commands/oprim/${filename}`));
      }
    }

    // Tombstone: remove legacy on-skill-archive.sh (replaced by on-prompt-submit + on-stop in v0.x)
    const legacyHookPath = path.join(claudeDir, 'hooks', 'on-skill-archive.sh');
    if (fs.existsSync(legacyHookPath)) {
      fs.unlinkSync(legacyHookPath);
      console.log(chalk.dim('  removed legacy hook .claude/hooks/on-skill-archive.sh'));
    }

    // Hooks: UserPromptSubmit + Stop for co-archival coordination
    const hooksDir = path.join(claudeDir, 'hooks');
    writeFile(path.join(hooksDir, 'config.json'), hooksConfig(framework));
    console.log(chalk.green('✓') + ' .claude/hooks/config.json');

    const promptSubmitPath = path.join(hooksDir, 'on-prompt-submit.sh');
    writeFile(promptSubmitPath, ON_PROMPT_SUBMIT_HOOK);
    fs.chmodSync(promptSubmitPath, 0o755);
    console.log(chalk.green('✓') + ' .claude/hooks/on-prompt-submit.sh');

    const stopHookPath = path.join(hooksDir, 'on-stop.sh');
    writeFile(stopHookPath, ON_STOP_HOOK);
    fs.chmodSync(stopHookPath, 0o755);
    console.log(chalk.green('✓') + ' .claude/hooks/on-stop.sh');

    mergeClaudeSettingsHooks(claudeDir);

    if (dirCreated) {
      console.log(chalk.dim('  .claude/ created — Claude Code will discover these files automatically.'));
    }
  } else if (agent === 'cursor') {
    const cursorDir = path.join(projectRoot, '.cursor');
    const dirCreated = !fs.existsSync(cursorDir);

    const skillsBase = path.join(cursorDir, 'skills');
    for (const [name, content] of Object.entries(CURSOR_SKILLS)) {
      writeFile(path.join(skillsBase, name, 'SKILL.md'), content);
      console.log(chalk.green('✓') + ` .cursor/skills/${name}/SKILL.md`);
    }

    const cmdsDir = path.join(cursorDir, 'commands');
    for (const [filename, content] of Object.entries(CURSOR_COMMANDS)) {
      writeFile(path.join(cmdsDir, filename), content);
      console.log(chalk.green('✓') + ` .cursor/commands/${filename}`);
    }

    if (dirCreated) {
      console.log(chalk.dim('  .cursor/ created — Cursor will discover these files automatically.'));
    }
  }
}

// ─── Claude skill playbooks ───────────────────────────────────────────────────

export const CLAUDE_SKILLS: Record<string, string> = {
  'oprim-pdr': pdrSkill(),
  'oprim-bet': betSkill(),
  'oprim-criteria': criteriaSkill(),
  'oprim-review': reviewSkill(),
  'oprim-archive': archiveSkill(),
};

// ─── Claude command wrappers (thin, invoke skill) ────────────────────────────

export const CLAUDE_COMMANDS: Record<string, string> = {
  'promote.md': claudeWrapper('OPRIM: Promote', 'Promote a prioritized bet to an OpenSpec change', promoteContent()),
  'sequence.md': claudeWrapper('OPRIM: Sequence', 'Validate and update the primer sequencing board', sequenceContent()),
  'archive.md': claudeWrapper('OPRIM: Archive', 'Archive a completed bet — move it out of the active board', archiveCommandContent()),
};

// ─── Cursor skill playbooks ───────────────────────────────────────────────────

export const CURSOR_SKILLS: Record<string, string> = {
  'oprim-pdr': pdrSkill(),
  'oprim-bet': betSkill(),
  'oprim-criteria': criteriaSkill(),
  'oprim-review': reviewSkill(),
};

// ─── Cursor command files (full inline — no Skill tool in Cursor) ────────────

export const CURSOR_COMMANDS: Record<string, string> = {
  'oprim-promote.md': cursorWrapper('oprim-promote', 'Promote a prioritized bet to an OpenSpec change', promoteContent()),
  'oprim-sequence.md': cursorWrapper('oprim-sequence', 'Validate and update the primer sequencing board', sequenceContent()),
  'oprim-pdr.md': cursorWrapper('oprim-pdr', 'Create a new Product Decision Record with auto-assigned ID', pdrInlineContent()),
  'oprim-bet.md': cursorWrapper('oprim-bet', 'Create a new bet decision and register it on the sequencing board', betInlineContent()),
  'oprim-criteria.md': cursorWrapper('oprim-criteria', 'Create or append to a criteria.yaml contract for a bet', criteriaInlineContent()),
  'oprim-review.md': cursorWrapper('oprim-review', "Create a KPI review artifact pre-filled from a bet's criteria contract", reviewInlineContent()),
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
description: Create a new Product Decision Record in oprim/decisions/ with auto-assigned ID and guided prompting
---

Create a new Product Decision Record (PDR) in \`oprim/decisions/\`.

## Steps

### 1. Get the decision title
If not provided, ask: "What is the title of this product decision?"

### 2. Assign the next PDR ID
Scan \`oprim/decisions/\` for files matching \`PDR-(\\d+)-\`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default \`001\` if none found.
Slug: title → lowercase → spaces to hyphens → remove non-alphanumeric (except hyphens).
Output path: \`oprim/decisions/PDR-NNN-<slug>.md\`

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
description: Create a new bet directory and bet-decision artifact in oprim/bets/, and add the bet to oprim/sequence.yaml backlog
---

Create a new bet in \`oprim/bets/\` and register it on the sequencing board.

## Steps

### 1. Get the bet title
Display the naming convention before asking:

> **Naming tip:** Use "verb + object [for context]"
> - Good: "Improve bet naming for scannability"
> - Bad: "Naming"

If not provided, ask: "What is the title of this bet?"

After receiving the title, validate: if fewer than 4 words OR fewer than 25 characters:
- Show: "Warning: this title may be too vague to scan at a glance."
- Suggest a reformulation, e.g. "Consider: 'Improve <what> for <why>'"
- Ask: "Proceed with this title anyway? (y/N)"
  - If "n" or Enter: ask for a revised title and re-validate
  - If "y": proceed with the original title

### 2. Assign the next BET ID
Scan \`oprim/bets/\` for directories matching \`BET-(\\d+)$\`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default \`001\` if none.

### 3. Check sequence.yaml exists
If \`oprim/sequence.yaml\` not found: report and stop — advise \`oprim init\`.

### 4. Gather content
Ask: Decision (Build now / Defer / Kill, default Build now), Owner, Review date (YYYY-MM-DD), Why now, Alternatives considered, Expected outcomes (metric: baseline → target in timeframe), Kill criteria / rollback trigger, PDR links (optional).

### 5. Write oprim/bets/BET-NNN/bet-decision.md
\`\`\`
# Decision: BET-NNN <title>
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

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

### 6. Append to oprim/sequence.yaml backlog
Read → parse YAML → append → write back (2-space indentation):
\`\`\`yaml
- id: BET-NNN
  title: "<title>"
  blocked_by: []
  unlocks: []
  requires_pdrs: []
\`\`\`

### 7. Prompt for optional discovery scaffolding
Ask: "Do you want to scaffold a discovery.md now? (y/N)"
- If "y": write \`oprim/bets/BET-NNN/discovery.md\` from the discovery template (same structure as \`oprim/templates/discovery.md\`).
- If "n" or Enter: skip silently.

### 8. Report what was created
`;
}

function criteriaSkill(): string {
  return `---
name: oprim-criteria
description: Create or append to a criteria.yaml contract for a bet, with structured Amplitude and BigQuery source mapping
---

Create or append to \`oprim/bets/BET-NNN/criteria.yaml\`.

## Steps

### 1. Identify the bet
If not provided, ask: "Which bet are you adding criteria for? (e.g. BET-042)"

### 2. Verify bet exists
If \`oprim/bets/BET-NNN/\` not found: report and stop — advise using the \`oprim-bet\` skill first.

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

function archiveSkill(): string {
  return `---
name: oprim-archive
description: Archive a completed bet — moves it to oprim/bets/archived/BET-NNN/ and removes its sequence.yaml entry
---

Archive a completed bet by moving it to \`oprim/bets/archived/\` and removing it from \`sequence.yaml\`.

## Steps

### 1. Get the bet ID

If provided as an argument (e.g., \`/oprim:archive BET-005\`), use it directly.

If not provided, ask: "Which bet ID would you like to archive? (e.g., BET-005)"

Normalize the input: accept \`bet-005\`, \`005\`, \`5\`, or \`BET-005\` — always treat as \`BET-NNN\` zero-padded to 3 digits.

### 2. Check the bet directory exists

Check whether \`oprim/bets/BET-NNN/\` exists.

If not found:
- Report: "Bet BET-NNN was not found in oprim/bets/. Nothing was changed."
- Stop.

### 3. Check for active dependencies in sequence.yaml

Read \`oprim/sequence.yaml\`. Scan every entry across all buckets (now, next, later, backlog) for any entry whose \`blocked_by\` or \`unlocks\` list contains the target bet ID.

If dependents are found:
- Show a warning listing each dependent entry and which field references the target bet.

  Example:
  \`\`\`
  ⚠ Warning: BET-005 is referenced by active bets:
    - BET-007 (blocked_by: [BET-005])
    - BET-008 (unlocks: [BET-005])
  \`\`\`
- Ask: "Archive BET-NNN anyway? These references will become stale. (y/N)"
  - If "n" or Enter: stop, no changes made.
  - If "y": proceed.

If no dependents found: proceed without warning.

### 4. Move the bet directory to archive

Create the archive subfolder if it doesn't exist:
\`\`\`bash
mkdir -p oprim/bets/archived
\`\`\`

Move the directory:
\`\`\`bash
mv oprim/bets/BET-NNN oprim/bets/archived/BET-NNN
\`\`\`

### 5. Remove the bet entry from sequence.yaml

Read \`oprim/sequence.yaml\`, parse it, and remove the entry with \`id: BET-NNN\` from whichever bucket it appears in (now, next, later, or backlog). Write the updated YAML back using 2-space indentation. Do not modify any other entries.

### 6. Report what was done

\`\`\`
## Bet Archived

**Bet:** BET-NNN
**Archived to:** oprim/bets/archived/BET-NNN/
**Removed from sequence.yaml:** ✓

The bet is preserved in full at the archive location.
\`\`\`
`;
}

function archiveCommandContent(): string {
  return `Use the Skill tool to invoke the \`oprim-archive\` skill.`;
}

function reviewSkill(): string {
  return `---
name: oprim-review
description: Create a KPI review artifact for a completed bet, pre-filled from criteria.yaml with actuals gathered from the user
---

Create a KPI review in \`oprim/reviews/\`.

## Steps

### 1. Identify the bet
If not provided, ask: "Which bet are you reviewing? (e.g. BET-042)"

### 2. Load criteria and check for a run result

Read \`oprim/bets/BET-NNN/criteria.yaml\` if it exists (pre-fills baseline and target).
If not found: inform user and continue with empty metrics list.

**Check for measurement run result:** Scan \`oprim/bets/BET-NNN/measurements/\` for files matching \`run-*.yaml\`. If any exist, sort by filename (date-based) and read the most recent.

**If a run result exists:** use it to pre-populate actuals and status for every metric. Skip step 3 for those metrics. Note the run date — include "Actuals from run: YYYY-MM-DD" in the review artifact.

**If no run result exists:** proceed to step 3 to gather actuals manually.

### 3. Gather actuals per metric (only when no run result)
For each metric show name/baseline/target and ask: "What was the actual result? (number or 'pending')"

Status logic:
- actual >= target → \`hit\`
- actual < target → \`missed\`
- 'pending' or not provided → \`pending\`

### 4. Get review metadata
Ask: reviewer name, decision quality notes.

### 5. Output path
\`oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md\` (today's date)

### 6. Write the review file
\`\`\`markdown
# KPI Review: BET-NNN

**Review date:** YYYY-MM-DD
**Reviewed by:** <reviewer>
**Actuals from run:** YYYY-MM-DD  ← include only when a run result was ingested

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
  return `Create a new PDR in \`oprim/decisions/\`. Scan for \`PDR-(\\d+)-\` to assign next ID (zero-padded, default 001). Gather: title, context, decision, alternatives, consequences, evidence, related bets/specs. Ask if superseding an existing PDR. Write \`oprim/decisions/PDR-NNN-<slug>.md\`. If superseding: update old PDR Status to "Superseded by PDR-NNN". Report what was created.`;
}

function betInlineContent(): string {
  return `Create a new bet in \`oprim/bets/\`. Before asking for the title, show: "Naming tip: verb + object [for context] — Good: 'Improve bet naming for scannability' / Bad: 'Naming'". Scan \`BET-(\\d+)$\` dirs for next ID (zero-padded, default 001). Check \`oprim/sequence.yaml\` exists (stop if not — advise oprim init). After receiving the title, validate: if fewer than 4 words OR fewer than 25 characters, warn "this title may be too vague", suggest a reformulation, and ask "Proceed anyway? (y/N)" — if "n", prompt for a revised title. Gather: decision (default Build now), owner, review date, why-now, alternatives, expected outcomes, kill criteria, PDR links. Write \`oprim/bets/BET-NNN/bet-decision.md\` with an inline naming tip comment in the header. Append entry to sequence.yaml backlog: \`{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}\`. Then ask: "Do you want to scaffold a discovery.md now? (y/N)" — if "y", write \`oprim/bets/BET-NNN/discovery.md\` from the discovery template (sections: Problem Framing, User Research Signals, Competitive Context, Open Questions); if "n" or Enter, skip silently. Report what was created.`;
}

function criteriaInlineContent(): string {
  return `Add metrics to \`oprim/bets/BET-NNN/criteria.yaml\`. Verify bet dir exists. Gather: metric ID, name, baseline, target, timeframe, launch date, segment. Ask source type (amplitude or bigquery). Amplitude: event, aggregation, denominator_event. BigQuery: table, metric_column, filter, aggregation, denominator_query. If file exists: append to metrics list (never overwrite). If not: create. Ask if adding more metrics. Report what was created.`;
}

function reviewInlineContent(): string {
  return `Create KPI review in \`oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md\`. Read \`criteria.yaml\` for pre-fill (baseline/target). Check \`oprim/bets/BET-NNN/measurements/\` for \`run-*.yaml\` files — if found, use the most recent to pre-populate actuals and status (include "Actuals from run: YYYY-MM-DD" note). If no run result, ask for each metric's actual value. Status: actual >= target → hit, actual < target → missed, not provided → pending. Ask reviewer name and decision quality notes. Write review with metric table and Actions checklist. Report what was created.`;
}

// ─── Hook scripts: co-archival coordination ──────────────────────────────────

function hooksConfig(framework: string): string {
  return (
    JSON.stringify(
      {
        framework,
        archive_commands:
          framework === 'openspec' ? ['/opsx:archive', '/openspec-archive-change'] : [],
      },
      null,
      2
    ) + '\n'
  );
}

const ON_PROMPT_SUBMIT_HOOK = `#!/usr/bin/env bash
# UserPromptSubmit hook: detects archive slash commands and sets a pending flag.

config_file=".claude/hooks/config.json"
flag_file=".claude/hooks/.archive-pending"

framework="openspec"
if [ -f "$config_file" ]; then
  framework=$(python3 -c "import sys,json; print(json.load(open('$config_file')).get('framework','openspec'))" 2>/dev/null || echo "openspec")
fi

prompt=$(cat | python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt',''))" 2>/dev/null || true)

[ -z "$prompt" ] && exit 0

if [ "$framework" = "openspec" ]; then
  if echo "$prompt" | grep -qE '^[[:space:]]*/(opsx:archive|openspec-archive-change)([[:space:]]|$)'; then
    arg=$(echo "$prompt" | sed 's|^[[:space:]]*/[^[:space:]]* *||' | sed 's|^@||' | sed 's|.*/changes/||' | sed 's|/$||' | xargs 2>/dev/null || true)
    echo "$arg" > "$flag_file"
  fi
fi
`;

const ON_STOP_HOOK = `#!/usr/bin/env bash
# Stop hook: if an archive command was detected, find the linked bet and prompt co-archival.

flag_file=".claude/hooks/.archive-pending"
[ -f "$flag_file" ] || exit 0

change=$(tr -d '[:space:]' < "$flag_file")
rm -f "$flag_file"

if [ -z "$change" ]; then
  latest=$(ls openspec/changes/archive/ 2>/dev/null | sort -r | head -1)
  [ -z "$latest" ] && exit 0
  change=$(echo "$latest" | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
fi

[ -z "$change" ] && exit 0

archive_dir=$(ls openspec/changes/archive/ 2>/dev/null | grep -F "$change" | sort -r | head -1)
[ -z "$archive_dir" ] && exit 0

proposal="openspec/changes/archive/$archive_dir/proposal.md"
[ -f "$proposal" ] || exit 0

bet_id=$(grep -oE 'BET-[0-9]+' "$proposal" | head -1)
[ -z "$bet_id" ] && exit 0

printf '{"decision":"block","reason":"The openspec change '\''%s'\'' was just archived. Its proposal.md references %s. Please invoke \`/oprim:archive %s\` to co-archive the linked bet."}\\n' "$change" "$bet_id" "$bet_id"
`;

// Merge UserPromptSubmit + Stop hooks into .claude/settings.json without clobbering existing entries.
// Also removes the legacy PostToolUse/Skill hook from on-skill-archive.sh if present.
function mergeClaudeSettingsHooks(claudeDir: string): void {
  const settingsPath = path.join(claudeDir, 'settings.json');
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      // Unreadable settings — start from scratch
    }
  }

  if (!settings.hooks) settings.hooks = {};
  const hooks = settings.hooks as Record<string, unknown>;

  // Tombstone: remove legacy PostToolUse/Skill entry from on-skill-archive.sh
  const legacyCommand = 'bash ".claude/hooks/on-skill-archive.sh"';
  if (hooks.PostToolUse) {
    const postToolUse = hooks.PostToolUse as Array<Record<string, unknown>>;
    const filtered = postToolUse.filter((entry) => {
      const entryHooks = entry.hooks as Array<Record<string, unknown>> | undefined;
      return !entryHooks?.some((h) => h.command === legacyCommand);
    });
    if (filtered.length === 0) {
      delete hooks.PostToolUse;
    } else {
      hooks.PostToolUse = filtered;
    }
  }

  // Register UserPromptSubmit hook
  const promptSubmitCommand = 'bash ".claude/hooks/on-prompt-submit.sh"';
  if (!hooks.UserPromptSubmit) hooks.UserPromptSubmit = [];
  const userPromptSubmit = hooks.UserPromptSubmit as Array<Record<string, unknown>>;
  const promptSubmitPresent = userPromptSubmit.some((entry) => {
    const entryHooks = entry.hooks as Array<Record<string, unknown>> | undefined;
    return entryHooks?.some((h) => h.command === promptSubmitCommand);
  });
  if (!promptSubmitPresent) {
    userPromptSubmit.push({ hooks: [{ type: 'command', command: promptSubmitCommand }] });
  }

  // Register Stop hook
  const stopCommand = 'bash ".claude/hooks/on-stop.sh"';
  if (!hooks.Stop) hooks.Stop = [];
  const stopHooks = hooks.Stop as Array<Record<string, unknown>>;
  const stopPresent = stopHooks.some((entry) => {
    const entryHooks = entry.hooks as Array<Record<string, unknown>> | undefined;
    return entryHooks?.some((h) => h.command === stopCommand);
  });
  if (!stopPresent) {
    stopHooks.push({ hooks: [{ type: 'command', command: stopCommand }] });
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  console.log(chalk.green('✓') + ' .claude/settings.json (UserPromptSubmit + Stop hooks registered)');
}

// ─── Legacy content (promote / sequence remain inline) ───────────────────────

function promoteContent(): string {
  return `
Promote a prioritized bet to an OpenSpec change and link criteria contracts.

**Input**: Specify a bet ID (e.g., \`/oprim:promote BET-042\`) or omit to be prompted.

**Steps**

1. **Locate the bet** — read \`oprim/bets/BET-XXX/bet-decision.md\`
2. **Validate status** — decision must be "Build now"
3. **Check authority boundary** — confirm primer artifact owns why/order/outcome only
4. **Create OpenSpec change** — derive the change name as \`bet-NNN-<slug>\` where \`NNN\` is the zero-padded bet number (e.g. BET-004 → \`bet-004\`) and \`<slug>\` is a short kebab-case summary of the change. Then invoke the \`/openspec-propose\` skill (or \`/opsx:propose\`) with that name to create the change directory with **all required artifacts**: \`proposal.md\`, \`design.md\`, \`tasks.md\`, and \`specs/<capability>/spec.md\` for every capability listed under \`## Capabilities\`.
   - Pass the bet decision content as context so the proposal reflects the bet's why/outcome
   - **Do not manually create a partial change directory** — the propose skill ensures no artifact is omitted
   - The spec file(s) are mandatory: each capability modified or added must have WHEN/THEN scenarios under \`## ADDED Requirements\` or \`## MODIFIED Requirements\`
5. **Link artifacts**:
   - Add OpenSpec change path to bet-decision \`## Links\` section
   - Add bet ID to OpenSpec proposal \`## Context\` section
6. **Copy criteria** — if \`oprim/bets/BET-XXX/criteria.yaml\` exists, link it from OpenSpec proposal
7. **Verify completeness** — confirm the change directory contains:
   - \`proposal.md\`
   - \`design.md\`
   - \`tasks.md\`
   - \`specs/<capability>/spec.md\` for each capability in \`## Capabilities\`
   If any artifact is missing, create it before reporting done.
8. **Report** — show what was linked and what remains for engineering
`;
}

function sequenceContent(): string {
  return `
Validate the primer sequencing board and suggest rebalancing if needed.

**Steps**

1. **Read board** — load \`oprim/sequence.yaml\`
2. **Check WIP limits** — compare \`now\` count against \`wip_limits.now\`
3. **Validate blockers** — for each bet in \`now\`, confirm all \`blocked_by\` entries are complete or absent
4. **Validate PDR preconditions** — confirm all \`requires_pdrs\` entries exist in \`oprim/decisions/\`
5. **Report violations** — list any WIP excess, unresolved blockers, or missing PDRs
6. **Suggest moves** — recommend bets to defer to \`next\` or \`later\` to resolve violations
`;
}
