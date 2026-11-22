import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { readCurrentTruth, writeCurrentTruth, type RequirementBlock } from '../lib/spec-delta';

export interface SpecMigrationReport {
  migrated: { capability: string; requirements: number; duplicates: string[] }[];
  failed: { capability: string; reason: string }[];
  canonical: string[];
}

const normalizeBlock = (b: RequirementBlock): string => b.content.trim().replace(/\s+/g, ' ');

/**
 * Rewrites every legacy current-truth spec under `oprim/specs/` (delta headings) to the
 * canonical format (preamble + one `## Requirements` section). A file is written only after
 * re-reading the output and confirming the preamble, the requirement count and every block's
 * normalized content are unchanged; otherwise it is left untouched and reported as failed.
 */
export function migrateLegacySpecs(projectRoot: string): SpecMigrationReport {
  const report: SpecMigrationReport = { migrated: [], failed: [], canonical: [] };
  const specsDir = path.join(projectRoot, 'oprim', 'specs');
  if (!fs.existsSync(specsDir)) return report;

  const capabilities = fs
    .readdirSync(specsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(specsDir, e.name, 'spec.md')))
    .map((e) => e.name)
    .sort();

  for (const capability of capabilities) {
    const specPath = path.join(specsDir, capability, 'spec.md');
    const original = fs.readFileSync(specPath, 'utf-8');
    const before = readCurrentTruth(original);

    if (!before.legacy) {
      report.canonical.push(capability);
      continue;
    }

    const accounted = before.blocks.length + before.removedCount + before.duplicates.length;
    if (accounted < before.headerLineCount) {
      report.failed.push({
        capability,
        reason: `found ${before.headerLineCount} requirement headers but parsed ${accounted}`,
      });
      continue;
    }

    const output = writeCurrentTruth(before);
    const after = readCurrentTruth(output);
    const sameBlocks =
      after.blocks.length === before.blocks.length &&
      after.headerLineCount === before.blocks.length &&
      after.blocks.every((b, i) => normalizeBlock(b) === normalizeBlock(before.blocks[i]!));

    if (after.legacy || after.preamble !== before.preamble || !sameBlocks) {
      report.failed.push({ capability, reason: 'rewritten file did not match the original requirements' });
      continue;
    }

    fs.writeFileSync(specPath, output);
    report.migrated.push({ capability, requirements: before.blocks.length, duplicates: before.duplicates });
  }

  return report;
}

function runSpecMigration(projectRoot: string): void {
  if (!fs.existsSync(path.join(projectRoot, 'oprim'))) {
    console.error(chalk.red('✗') + ' No oprim/ directory found — run ' + chalk.cyan('oprim init') + ' first.');
    process.exit(1);
  }

  const report = migrateLegacySpecs(projectRoot);

  if (report.migrated.length === 0 && report.failed.length === 0) {
    console.log(chalk.green('✓') + ' 0 legacy specs — nothing to migrate.');
    return;
  }

  for (const m of report.migrated) {
    console.log(chalk.green('✓') + ` migrated ${m.capability} (${m.requirements} requirements)`);
    for (const header of m.duplicates) {
      console.log(chalk.yellow(`    kept MODIFIED version of duplicated requirement "${header}"`));
    }
  }
  for (const f of report.failed) {
    console.log(chalk.red('✗') + ` skipped ${f.capability}: ${f.reason} — file left unchanged, migrate it by hand`);
  }
  console.log(
    `\n${report.migrated.length} migrated, ${report.failed.length} skipped, ${report.canonical.length} already canonical.`
  );
  if (report.failed.length > 0) process.exitCode = 1;
}

export function migrateCommand(): Command {
  return new Command('migrate')
    .description('Rename primer/ to oprim/ in the current repository')
    .option('--specs', 'rewrite legacy current-truth specs (delta headings) in oprim/specs/ to the canonical format')
    .action((opts: { specs?: boolean }) => {
      const projectRoot = process.cwd();

      if (opts.specs) {
        runSpecMigration(projectRoot);
        return;
      }

      const legacyDir = path.join(projectRoot, 'primer');
      const targetDir = path.join(projectRoot, 'oprim');

      if (fs.existsSync(targetDir)) {
        console.log(chalk.green('✓') + ' oprim/ already exists — nothing to migrate.');
        return;
      }

      if (!fs.existsSync(legacyDir)) {
        console.error(chalk.red('✗') + ' No primer/ directory found — run ' + chalk.cyan('oprim init') + ' to create oprim/.');
        process.exit(1);
      }

      fs.renameSync(legacyDir, targetDir);
      console.log(chalk.green('✓') + ' Renamed ' + chalk.gray('primer/') + ' → ' + chalk.gray('oprim/'));
      console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
    });
}
