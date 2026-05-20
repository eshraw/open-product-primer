import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { writeFile } from '../lib/scaffold';

export function updateCommand(): Command {
  return new Command('update')
    .description('Refresh /oprim:* assistant commands from package templates')
    .action(() => {
      const projectRoot = process.cwd();
      let updated = 0;

      if (fs.existsSync(path.join(projectRoot, '.claude'))) {
        const claudeDir = path.join(projectRoot, '.claude', 'commands', 'oprim');
        writeFile(path.join(claudeDir, 'promote.md'), claudeCommandContent('promote', 'OPRIM: Promote', promoteContent()));
        writeFile(path.join(claudeDir, 'sequence.md'), claudeCommandContent('sequence', 'OPRIM: Sequence', sequenceContent()));
        console.log(chalk.green('✓') + ' .claude/commands/oprim/promote.md');
        console.log(chalk.green('✓') + ' .claude/commands/oprim/sequence.md');
        updated += 2;
      }

      if (fs.existsSync(path.join(projectRoot, '.cursor'))) {
        const cursorDir = path.join(projectRoot, '.cursor', 'commands');
        writeFile(path.join(cursorDir, 'oprim-promote.md'), cursorCommandContent('oprim-promote', promoteContent()));
        writeFile(path.join(cursorDir, 'oprim-sequence.md'), cursorCommandContent('oprim-sequence', sequenceContent()));
        console.log(chalk.green('✓') + ' .cursor/commands/oprim-promote.md');
        console.log(chalk.green('✓') + ' .cursor/commands/oprim-sequence.md');
        updated += 2;
      }

      if (updated === 0) {
        console.log(chalk.yellow('No assistant environments detected (.claude/, .cursor/).'));
        console.log('Run this command from a repository where AI tools are configured.');
      } else {
        console.log(`\n${updated} command file(s) updated.`);
      }
    });
}

function claudeCommandContent(id: string, name: string, body: string): string {
  return `---
name: "${name}"
description: ${name}
category: Workflow
tags: [workflow, primer]
---
${body}`;
}

function cursorCommandContent(id: string, body: string): string {
  return `---
name: /${id}
id: ${id}
category: Workflow
description: Open Product Primer — ${id.replace('oprim-', '')} command
---
${body}`;
}

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

**Authority boundary check**

Before completing, verify:
- primer artifact: contains rationale, priorities, outcomes, criteria
- OpenSpec artifact: contains requirements, design, implementation tasks
- No duplication of content across boundary

**Output**

\`\`\`
## Promoted: BET-XXX → openspec/changes/<change-name>

Linked:
- primer/bets/BET-XXX/bet-decision.md → openspec/changes/<change-name>/
- primer/bets/BET-XXX/criteria.yaml → linked in OpenSpec proposal context

Next: run /opsx:propose <change-name> to generate implementation artifacts.
\`\`\`
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

**Output**

\`\`\`
## Sequencing Board Validation

WIP: 2/2 (at limit)

Issues:
- BET-051 in 'now' blocked by BET-042 (not complete)

Suggestions:
- Move BET-051 to 'next' until BET-042 ships

PDR preconditions: all satisfied
\`\`\`
`;
}
