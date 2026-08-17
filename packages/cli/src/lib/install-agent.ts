import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { writeFile } from './scaffold';
import { detectAvailableAgents } from './detect';
import { readSpecFramework, deriveDefaultSpecFramework } from './config-merge';
import { loadWorkflowSchema } from './workflow-schema';
import { renderSkillBody, renderClaudeCommand, renderCursorCommand, renderAgentInstructions } from './workflow-renderer';

export type Agent = 'claude' | 'cursor' | 'codex' | 'gemini' | 'poolside' | 'vibe';
export const SUPPORTED_AGENTS: readonly Agent[] = ['claude', 'cursor', 'codex', 'gemini', 'poolside', 'vibe'];

// oprim/config.yaml (via integrations.spec_framework) is the source of truth for the
// selected speccing framework; .claude/hooks/config.json is checked only as a fallback for
// projects that installed before that key existed.
function readPersistedFramework(projectRoot: string): string | null {
  const configYamlPath = path.join(projectRoot, 'oprim', 'config.yaml');
  if (fs.existsSync(configYamlPath)) {
    const persisted = readSpecFramework(fs.readFileSync(configYamlPath, 'utf-8'));
    if (persisted) return persisted;
  }
  const hooksConfigPath = path.join(projectRoot, '.claude', 'hooks', 'config.json');
  if (fs.existsSync(hooksConfigPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf-8')) as Record<string, unknown>;
      if (typeof existing.framework === 'string') return existing.framework;
    } catch {
      // fallthrough
    }
  }
  return null;
}

export async function promptFrameworkSelection(projectRoot: string): Promise<string> {
  const persisted = readPersistedFramework(projectRoot);
  if (persisted) {
    console.log(chalk.dim(`  Speccing framework: ${persisted} (from config)`));
    return persisted;
  }
  const { select } = await import('@inquirer/prompts');
  return select({
    message: 'Which speccing framework does this project use?',
    choices: [
      { name: 'Native (oprim-authored specs, recommended)', value: 'native' },
      { name: 'OpenSpec', value: 'openspec' },
      { name: 'None', value: 'none' },
    ],
  });
}

// No-prompt resolution used where an interactive choice isn't appropriate (e.g. non-Claude
// agent branches): the persisted value if one exists, else a default derived from the
// project's existing openspec state.
export function resolveSpecFramework(projectRoot: string): string {
  const persisted = readPersistedFramework(projectRoot);
  if (persisted) return persisted;
  const configYamlPath = path.join(projectRoot, 'oprim', 'config.yaml');
  if (fs.existsSync(configYamlPath)) {
    return deriveDefaultSpecFramework(fs.readFileSync(configYamlPath, 'utf-8'));
  }
  return 'none';
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
      { name: 'Codex', value: 'codex', checked: detected.includes('codex') },
      { name: 'Gemini CLI', value: 'gemini', checked: detected.includes('gemini') },
      { name: 'Poolside', value: 'poolside', checked: detected.includes('poolside') },
      { name: 'Mistral Vibe', value: 'vibe', checked: detected.includes('vibe') },
    ],
  });
}

export async function promptPdrSurfacing(): Promise<boolean> {
  const { confirm } = await import('@inquirer/prompts');
  return confirm({ message: 'Enable proactive PDR surfacing in skills? (Y/n)', default: true });
}

export async function promptOkfFrontmatter(): Promise<boolean> {
  const { confirm } = await import('@inquirer/prompts');
  return confirm({
    message: 'Enable OKF (Open Knowledge Format) frontmatter on scaffolded artifacts? (y/N)',
    default: false,
  });
}

// Workflow ids installed as Claude/Poolside/Cursor skill files — see packages/cli/src/workflows/.
// Order matches the pre-refactor CLAUDE_SKILLS/POOLSIDE_SKILLS/CURSOR_SKILLS declaration order.
const CLAUDE_SKILL_WORKFLOW_IDS = ['pdr', 'bet', 'note', 'criteria', 'review', 'archive', 'sequence', 'context'];
const POOLSIDE_SKILL_WORKFLOW_IDS = ['pdr', 'bet', 'note', 'criteria', 'review', 'archive', 'sequence'];
const CURSOR_SKILL_WORKFLOW_IDS = ['pdr', 'bet', 'note', 'criteria', 'review'];

// Claude command wrappers (thin, invoke skill) — filename -> workflow id. Order matches the
// pre-refactor CLAUDE_COMMANDS declaration order.
const CLAUDE_COMMAND_WORKFLOWS: Array<{ filename: string; id: string }> = [
  { filename: 'promote.md', id: 'promote' },
  { filename: 'sequence.md', id: 'sequence' },
  { filename: 'archive.md', id: 'archive' },
  { filename: 'context-init.md', id: 'context' },
];

// Cursor command files (full inline). Order matches the pre-refactor CURSOR_COMMANDS declaration order.
const CURSOR_COMMAND_WORKFLOW_IDS = ['promote', 'sequence', 'pdr', 'bet', 'note', 'criteria', 'review'];

export function installAgentSkills(
  agent: Agent,
  projectRoot: string,
  framework = 'openspec',
  pdrSurfacing = false
): void {
  if (agent === 'claude') {
    const claudeDir = path.join(projectRoot, '.claude');
    const dirCreated = !fs.existsSync(claudeDir);

    const skillsBase = path.join(claudeDir, 'skills');

    // oprim:context skill — install when opted in, remove when opted out
    const contextSkillPath = path.join(skillsBase, 'oprim:context', 'SKILL.md');
    if (pdrSurfacing) {
      writeFile(contextSkillPath, oprimContextSkill());
      console.log(chalk.green('✓') + ' .claude/skills/oprim:context/SKILL.md');
    } else if (fs.existsSync(contextSkillPath)) {
      fs.unlinkSync(contextSkillPath);
      try { fs.rmdirSync(path.dirname(contextSkillPath)); } catch { /* not empty or already gone */ }
      console.log(chalk.dim('  removed .claude/skills/oprim:context/SKILL.md'));
    }

    // oprim skills — prepend Step 0 when opted in
    for (const id of CLAUDE_SKILL_WORKFLOW_IDS) {
      const schema = loadWorkflowSchema(id, projectRoot);
      if (!schema.claude.skill || !schema.skillName) continue;
      const body = renderSkillBody(id, projectRoot);
      const skillContent = pdrSurfacing ? withContextStep(body) : body;
      writeFile(path.join(skillsBase, schema.skillName, 'SKILL.md'), skillContent);
      console.log(chalk.green('✓') + ` .claude/skills/${schema.skillName}/SKILL.md`);
    }

    // oprim-spec (native spec authoring) — install only when spec_framework is native, remove otherwise
    const specSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
    if (framework === 'native') {
      const specBody = renderSkillBody('spec-authoring', projectRoot);
      const specSkillContent = pdrSurfacing ? withContextStep(specBody) : specBody;
      writeFile(specSkillPath, specSkillContent);
      console.log(chalk.green('✓') + ' .claude/skills/oprim-spec/SKILL.md');
    } else if (fs.existsSync(specSkillPath)) {
      fs.unlinkSync(specSkillPath);
      try { fs.rmdirSync(path.dirname(specSkillPath)); } catch { /* not empty or already gone */ }
      console.log(chalk.dim('  removed .claude/skills/oprim-spec/SKILL.md'));
    }

    // openspec skills — add/remove Step 0 in-place when they exist
    for (const name of OPENSPEC_SKILL_NAMES) {
      const skillFilePath = path.join(skillsBase, name, 'SKILL.md');
      if (fs.existsSync(skillFilePath)) {
        const current = fs.readFileSync(skillFilePath, 'utf-8');
        const updated = pdrSurfacing ? addContextStepToFile(current) : removeContextStepFromFile(current);
        if (updated !== current) {
          fs.writeFileSync(skillFilePath, updated, 'utf-8');
          console.log(
            chalk.green('✓') +
              ` .claude/skills/${name}/SKILL.md (PDR surfacing ${pdrSurfacing ? 'enabled' : 'disabled'})`
          );
        }
      }
    }

    const cmdsDir = path.join(claudeDir, 'commands', 'oprim');
    for (const { filename, id } of CLAUDE_COMMAND_WORKFLOWS) {
      const content = renderClaudeCommand(id, projectRoot, framework);
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
  } else if (agent === 'poolside') {
    const poolsideDir = path.join(projectRoot, '.poolside');
    const dirCreated = !fs.existsSync(poolsideDir);

    const skillsBase = path.join(poolsideDir, 'skills');
    for (const id of POOLSIDE_SKILL_WORKFLOW_IDS) {
      const schema = loadWorkflowSchema(id, projectRoot);
      if (!schema.poolside.skill || !schema.skillName) continue;
      writeFile(path.join(skillsBase, schema.skillName, 'SKILL.md'), renderSkillBody(id, projectRoot));
      console.log(chalk.green('✓') + ` .poolside/skills/${schema.skillName}/SKILL.md`);
    }

    const poolsideSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
    if (framework === 'native') {
      writeFile(poolsideSpecSkillPath, renderSkillBody('spec-authoring', projectRoot));
      console.log(chalk.green('✓') + ' .poolside/skills/oprim-spec/SKILL.md');
    } else if (fs.existsSync(poolsideSpecSkillPath)) {
      fs.unlinkSync(poolsideSpecSkillPath);
      try { fs.rmdirSync(path.dirname(poolsideSpecSkillPath)); } catch { /* not empty or already gone */ }
      console.log(chalk.dim('  removed .poolside/skills/oprim-spec/SKILL.md'));
    }

    const agentsFile = path.join(projectRoot, 'AGENTS.md');
    writeAgentInstructionFile(agentsFile, poolsideInstructions());
    console.log(chalk.green('✓') + ' AGENTS.md (oprim section written)');

    if (dirCreated) {
      console.log(chalk.dim('  .poolside/ created — Poolside will discover these files automatically.'));
    }
  } else if (agent === 'vibe') {
    const vibeDir = path.join(projectRoot, '.vibe');
    const dirCreated = !fs.existsSync(vibeDir);

    const skillsBase = path.join(vibeDir, 'skills');
    for (const id of POOLSIDE_SKILL_WORKFLOW_IDS) {
      const schema = loadWorkflowSchema(id, projectRoot);
      if (!schema.vibe.skill || !schema.skillName) continue;
      writeFile(path.join(skillsBase, schema.skillName, 'SKILL.md'), renderSkillBody(id, projectRoot));
      console.log(chalk.green('✓') + ` .vibe/skills/${schema.skillName}/SKILL.md`);
    }

    const vibeSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
    if (framework === 'native') {
      writeFile(vibeSpecSkillPath, renderSkillBody('spec-authoring', projectRoot));
      console.log(chalk.green('✓') + ' .vibe/skills/oprim-spec/SKILL.md');
    } else if (fs.existsSync(vibeSpecSkillPath)) {
      fs.unlinkSync(vibeSpecSkillPath);
      try { fs.rmdirSync(path.dirname(vibeSpecSkillPath)); } catch { /* not empty or already gone */ }
      console.log(chalk.dim('  removed .vibe/skills/oprim-spec/SKILL.md'));
    }

    const agentsFile = path.join(projectRoot, 'AGENTS.md');
    writeAgentInstructionFile(agentsFile, vibeInstructions());
    console.log(chalk.green('✓') + ' AGENTS.md (oprim section written)');

    if (dirCreated) {
      console.log(chalk.dim('  .vibe/ created — Mistral Vibe will discover these files automatically.'));
    }
  } else if (agent === 'codex') {
    const agentsFile = path.join(projectRoot, 'AGENTS.md');
    writeAgentInstructionFile(agentsFile, codexInstructions());
    console.log(chalk.green('✓') + ' AGENTS.md (oprim section written)');
  } else if (agent === 'gemini') {
    const geminiFile = path.join(projectRoot, 'GEMINI.md');
    writeAgentInstructionFile(geminiFile, geminiInstructions());
    console.log(chalk.green('✓') + ' GEMINI.md (oprim section written)');
  } else if (agent === 'cursor') {
    const cursorDir = path.join(projectRoot, '.cursor');
    const dirCreated = !fs.existsSync(cursorDir);

    const skillsBase = path.join(cursorDir, 'skills');
    for (const id of CURSOR_SKILL_WORKFLOW_IDS) {
      const schema = loadWorkflowSchema(id, projectRoot);
      if (!schema.cursor.skill || !schema.skillName) continue;
      writeFile(path.join(skillsBase, schema.skillName, 'SKILL.md'), renderSkillBody(id, projectRoot));
      console.log(chalk.green('✓') + ` .cursor/skills/${schema.skillName}/SKILL.md`);
    }

    const cursorSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
    if (framework === 'native') {
      writeFile(cursorSpecSkillPath, renderSkillBody('spec-authoring', projectRoot));
      console.log(chalk.green('✓') + ' .cursor/skills/oprim-spec/SKILL.md');
    } else if (fs.existsSync(cursorSpecSkillPath)) {
      fs.unlinkSync(cursorSpecSkillPath);
      try { fs.rmdirSync(path.dirname(cursorSpecSkillPath)); } catch { /* not empty or already gone */ }
      console.log(chalk.dim('  removed .cursor/skills/oprim-spec/SKILL.md'));
    }

    const cmdsDir = path.join(cursorDir, 'commands');
    for (const id of CURSOR_COMMAND_WORKFLOW_IDS) {
      const schema = loadWorkflowSchema(id, projectRoot);
      if (!schema.cursor.command) continue;
      const content = renderCursorCommand(id, projectRoot, framework);
      writeFile(path.join(cmdsDir, schema.cursor.command), content);
      console.log(chalk.green('✓') + ` .cursor/commands/${schema.cursor.command}`);
    }

    if (dirCreated) {
      console.log(chalk.dim('  .cursor/ created — Cursor will discover these files automatically.'));
    }
  }
}

// ─── PDR context surfacing ────────────────────────────────────────────────────

const CTX_STEP_START = '<!-- oprim:context:start -->';
const CTX_STEP_END = '<!-- oprim:context:end -->';

export const OPRIM_CONTEXT_SKILL_STEP = `## Step 0: Check relevant product decisions
Invoke the \`oprim:context\` skill using the Skill tool. If matching PDRs are surfaced, review them before proceeding. If no PDRs match or \`oprim/decisions/\` is empty, the skill exits silently — continue to Step 1 immediately.`;

// Openspec skill names whose files are managed by the openspec CLI and modified in-place by oprim
const OPENSPEC_SKILL_NAMES = [
  'openspec-propose',
  'openspec-apply-change',
  'openspec-explore',
  'openspec-archive-change',
] as const;

// Insert Step 0 into an oprim skill string (written fresh each time — no markers needed)
function withContextStep(content: string): string {
  const lines = content.split('\n');
  let closingDash = -1;
  let dashCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      dashCount++;
      if (dashCount === 2) { closingDash = i; break; }
    }
  }
  if (closingDash === -1) return OPRIM_CONTEXT_SKILL_STEP + '\n\n' + content;
  const front = lines.slice(0, closingDash + 1).join('\n');
  const body = lines.slice(closingDash + 1).join('\n').trimStart();
  return `${front}\n\n${OPRIM_CONTEXT_SKILL_STEP}\n\n${body}`;
}

// Idempotently add Step 0 to an openspec skill file (read-modify-write)
function addContextStepToFile(content: string): string {
  if (content.includes(CTX_STEP_START)) return content; // already present
  const lines = content.split('\n');
  let closingDash = -1;
  let dashCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      dashCount++;
      if (dashCount === 2) { closingDash = i; break; }
    }
  }
  const block = `${CTX_STEP_START}\n${OPRIM_CONTEXT_SKILL_STEP}\n${CTX_STEP_END}`;
  if (closingDash === -1) return block + '\n\n' + content;
  const front = lines.slice(0, closingDash + 1).join('\n');
  const body = lines.slice(closingDash + 1).join('\n').trimStart();
  return `${front}\n\n${block}\n\n${body}`;
}

// Remove Step 0 block from an openspec skill file (read-modify-write)
function removeContextStepFromFile(content: string): string {
  const s = content.indexOf(CTX_STEP_START);
  if (s === -1) return content;
  const e = content.indexOf(CTX_STEP_END, s);
  if (e === -1) return content;
  const before = content.slice(0, s).trimEnd();
  const after = content.slice(e + CTX_STEP_END.length).replace(/^\n+/, '\n');
  return before + after;
}

// The oprim:context skill (PDR-surfacing lookup) is install-time plumbing tied to the
// pdrSurfacing toggle, not a forkable workflow artifact — it stays a small literal here
// rather than moving into the declarative workflow-schema system.
function oprimContextSkill(): string {
  return `---
name: oprim:context
description: Surface relevant product decisions from oprim/decisions/ by keyword-matching against the current conversation — invoke at the start of any oprim or openspec workflow when PDR surfacing is enabled
---

Scan \`oprim/decisions/\` and surface PDRs that match keywords from the current conversation.

## Steps

### 1. Check for decisions
Scan \`oprim/decisions/\` for files matching \`PDR-*.md\`. If the directory is empty or contains no PDR files, exit silently — produce no output and return immediately.

### 2. Extract keywords
From the current conversation context, extract 3–10 topic keywords: bet IDs referenced (e.g. \`BET-007\`), capability names, filenames mentioned, subject-area nouns. Focus on the most specific and distinctive terms.

### 3. Match PDRs
For each PDR file: read the filename and the first 25 lines (to capture title, status, and context). A PDR is relevant if any keyword appears in the filename, title (\`# PDR-NNN: ...\`), or body text (case-insensitive).

### 4. Report or exit silently
If one or more PDRs match:

**Relevant product decisions:**
- PDR-NNN: <title> — <Status> (\`oprim/decisions/PDR-NNN-<slug>.md\`)

List each match on its own line, then return — the invoking skill continues to its next step.

If no PDRs match: exit silently — produce no output.
`;
}

// ─── Bundled skill/command exports (bundled defaults, no project overrides — used by tests
// and oprim doctor's skill-drift check; installAgentSkills() itself resolves overrides
// per-project via workflow-schema.ts/workflow-renderer.ts) ────────────────────────────────

export const CLAUDE_SKILLS: Record<string, string> = Object.fromEntries(
  CLAUDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = loadWorkflowSchema(id);
    return [schema.skillName as string, renderSkillBody(id)];
  })
);

export const CLAUDE_COMMANDS: Record<string, string> = Object.fromEntries(
  CLAUDE_COMMAND_WORKFLOWS.map(({ filename, id }) => [filename, renderClaudeCommand(id)])
);

export const POOLSIDE_SKILLS: Record<string, string> = Object.fromEntries(
  POOLSIDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = loadWorkflowSchema(id);
    return [schema.skillName as string, renderSkillBody(id)];
  })
);

export const VIBE_SKILLS: Record<string, string> = Object.fromEntries(
  POOLSIDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = loadWorkflowSchema(id);
    return [schema.skillName as string, renderSkillBody(id)];
  })
);

export const CURSOR_SKILLS: Record<string, string> = Object.fromEntries(
  CURSOR_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = loadWorkflowSchema(id);
    return [schema.skillName as string, renderSkillBody(id)];
  })
);

export const CURSOR_COMMANDS: Record<string, string> = Object.fromEntries(
  CURSOR_COMMAND_WORKFLOW_IDS.map((id) => {
    const schema = loadWorkflowSchema(id);
    return [schema.cursor.command as string, renderCursorCommand(id)];
  })
);

export function specAuthoringSkill(): string {
  return renderSkillBody('spec-authoring');
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
# UserPromptSubmit hook: detects lifecycle slash commands and sets pending flags.

archive_flag=".claude/hooks/.archive-pending"
nudge_flag=".claude/hooks/.sequence-nudge"

input=$(cat)

# Archive co-archival detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*(opsx:archive|openspec-archive-change)'; then
  prompt=$(printf '%s' "$input" | grep -oE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"//;s/"$//')
  arg=$(printf '%s' "$prompt" | sed 's|^[[:space:]]*/[^[:space:]]* *||' | awk '{print $1}' | sed 's|^@||' | sed 's|.*/changes/||' | sed 's|/$||' | xargs 2>/dev/null || true)
  printf '%s' "$arg" > "$archive_flag"
fi

# Bet creation detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*oprim:bet'; then
  printf 'bet-created' > "$nudge_flag"
fi

# Bet promotion detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*oprim:promote'; then
  printf 'bet-promoted' > "$nudge_flag"
fi
`;

const ON_STOP_HOOK = `#!/usr/bin/env bash
# Stop hook: archive co-archival coordination and sequencing nudges.

archive_flag=".claude/hooks/.archive-pending"
nudge_flag=".claude/hooks/.sequence-nudge"

# --- Archive co-archival block ---
if [ -f "$archive_flag" ]; then
  change=$(tr -d '[:space:]' < "$archive_flag")

  if [ -z "$change" ]; then
    latest=$(ls openspec/changes/archive/ 2>/dev/null | sort -r | head -1)
    [ -n "$latest" ] && change=$(echo "$latest" | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
  fi

  if [ -n "$change" ]; then
    archive_dir=$(ls openspec/changes/archive/ 2>/dev/null | grep -F "$change" | sort -r | head -1)
    if [ -n "$archive_dir" ]; then
      rm -f "$archive_flag"
      proposal="openspec/changes/archive/$archive_dir/proposal.md"
      if [ -f "$proposal" ]; then
        bet_id=$(grep -oE 'BET-[0-9]+' "$proposal" | head -1)
        if [ -n "$bet_id" ]; then
          printf '{"decision":"block","reason":"The openspec change '''%s''' was just archived. Its proposal.md references %s. Please invoke \`/oprim:archive %s\` to co-archive the linked bet."}\\n' "$change" "$bet_id" "$bet_id"
          exit 0
        fi
      fi
    fi
  fi
fi

# --- Sequencing nudge from lifecycle event ---
if [ -f "$nudge_flag" ]; then
  context=$(cat "$nudge_flag")
  rm -f "$nudge_flag"

  case "$context" in
    bet-created)
      printf '\\n💡 A new bet was added to your backlog. Run \`/oprim:sequence\` to check if it should be pulled into Now or Next.\\n'
      ;;
    bet-promoted)
      printf '\\n💡 A bet was promoted to an OpenSpec change. Run \`/oprim:sequence\` to verify the board reflects this.\\n'
      ;;
  esac
fi

# --- Open Now slot check ---
if [ -f "oprim/sequence.yaml" ]; then
  wip_limit=$(awk '/^wip_limits:/{in_wip=1} in_wip && /^  now:/{print $2; exit} /^[^ ]/{in_wip=0}' oprim/sequence.yaml 2>/dev/null)
  now_count=$(awk '/^now:/{in_now=1; next} in_now && /^[^ ]/{in_now=0} in_now && /^  - id:/{count++} END{print count+0}' oprim/sequence.yaml 2>/dev/null)
  next_count=$(awk '/^next:/{in_next=1; next} in_next && /^[^ ]/{in_next=0} in_next && /^  - id:/{count++} END{print count+0}' oprim/sequence.yaml 2>/dev/null)

  if [ -n "$wip_limit" ] && [ -n "$now_count" ] && [ -n "$next_count" ]; then
    if [ "$now_count" -lt "$wip_limit" ] 2>/dev/null && [ "$next_count" -gt 0 ] 2>/dev/null; then
      printf '\\n💡 Now lane has capacity (%s/%s). Run \`/oprim:sequence\` to pull something from Next.\\n' "$now_count" "$wip_limit"
    fi
  fi
fi
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

// ─── Instruction-file helpers (Codex / Gemini CLI) ────────────────────────────

const OPRIM_START = '<!-- oprim:start -->';
const OPRIM_END = '<!-- oprim:end -->';

export function writeAgentInstructionFile(filePath: string, section: string): void {
  const delimited = `${OPRIM_START}\n${section}\n${OPRIM_END}`;
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, delimited + '\n', 'utf-8');
    return;
  }
  const existing = fs.readFileSync(filePath, 'utf-8');
  const startIdx = existing.indexOf(OPRIM_START);
  const endIdx = existing.indexOf(OPRIM_END);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existing.slice(0, startIdx);
    const after = existing.slice(endIdx + OPRIM_END.length);
    fs.writeFileSync(filePath, before + delimited + after, 'utf-8');
  } else {
    const separator = existing.endsWith('\n') ? '\n' : '\n\n';
    fs.writeFileSync(filePath, existing + separator + delimited + '\n', 'utf-8');
  }
}

export function codexInstructions(): string {
  return renderAgentInstructions();
}

export function geminiInstructions(): string {
  return renderAgentInstructions();
}

export function poolsideInstructions(): string {
  return renderAgentInstructions();
}

export function vibeInstructions(): string {
  return renderAgentInstructions();
}
