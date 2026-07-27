import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { type Check, checkSequenceIntegrity, checkSkillVersionDrift } from '../lib/integrity';
import { checkBetDefinitionOfDone, checkSpecDeltaDrift, checkCrossBetConflicts } from '../lib/validate-checks';
import { foldDelta, resolveBetDirectory } from '../lib/spec-delta';

function runChecks(projectRoot: string): Check[] {
  const checks: Check[] = [];
  checkSequenceIntegrity(projectRoot, checks);
  checkSkillVersionDrift(projectRoot, checks);
  checkBetDefinitionOfDone(projectRoot, checks);
  checkSpecDeltaDrift(projectRoot, checks);
  checkCrossBetConflicts(projectRoot, checks);
  return checks;
}

function printReport(checks: Check[]): void {
  console.log(chalk.bold('oprim validate') + '\n');

  for (const check of checks) {
    const icon = check.pass ? chalk.green('✓') : check.required ? chalk.red('✗') : chalk.yellow('○');
    const label = check.pass ? chalk.white(check.name) : chalk.gray(check.name);
    const note = check.note ? chalk.dim(`  (${check.note})`) : '';
    console.log(`  ${icon} ${label}${note}`);
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log(`\n${passed}/${checks.length} checks passed.`);
}

function runDiff(projectRoot: string, betIdInput: string): void {
  const betsDir = path.join(projectRoot, 'oprim', 'bets');
  const resolvedDir = resolveBetDirectory(betsDir, betIdInput);

  if (!resolvedDir) {
    console.error(chalk.red(`Bet ${betIdInput} was not found in oprim/bets/.`));
    process.exitCode = 1;
    return;
  }

  const specsDir = path.join(betsDir, resolvedDir, 'specs');
  if (!fs.existsSync(specsDir)) {
    console.log(`${resolvedDir} has no spec deltas to preview.`);
    return;
  }

  const capEntries = fs.readdirSync(specsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  const capsWithDelta = capEntries.filter((e) => fs.existsSync(path.join(specsDir, e.name, 'spec.md')));

  if (capsWithDelta.length === 0) {
    console.log(`${resolvedDir} has no spec deltas to preview.`);
    return;
  }

  for (const capEntry of capsWithDelta) {
    const deltaContent = fs.readFileSync(path.join(specsDir, capEntry.name, 'spec.md'), 'utf-8');
    const currentTruthPath = path.join(projectRoot, 'oprim', 'specs', capEntry.name, 'spec.md');
    const currentTruth = fs.existsSync(currentTruthPath) ? fs.readFileSync(currentTruthPath, 'utf-8') : null;

    console.log(chalk.bold(`═══ ${capEntry.name} ═══`));
    try {
      const result = foldDelta(currentTruth, deltaContent);
      console.log(result.content);
      for (const note of result.notes) {
        console.log(chalk.yellow(`  note: ${note}`));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exitCode = 1;
    }
    console.log('');
  }
}

export function validateCommand(): Command {
  return new Command('validate')
    .description('CI-gateable validation of oprim board and spec-delta integrity')
    .option('--json', 'print machine-readable JSON instead of the human-readable report')
    .option('--strict', 'exit non-zero if any check fails, not only required ones')
    .option('--diff <bet-id>', "preview a bet's spec-delta merge result without writing files")
    .action((opts) => {
      const projectRoot = process.cwd();

      if (opts.diff) {
        runDiff(projectRoot, opts.diff);
        return;
      }

      const checks = runChecks(projectRoot);

      if (opts.json) {
        console.log(JSON.stringify({ checks }));
      } else {
        printReport(checks);
      }

      const requiredFailed = checks.some((c) => c.required && !c.pass);
      const anyFailed = checks.some((c) => !c.pass);
      const shouldFail = opts.strict ? anyFailed : requiredFailed;

      if (shouldFail) {
        process.exitCode = 1;
      }
    });
}
