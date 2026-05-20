import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import { detectOpenSpec, detectGraphify } from '../lib/detect';
import { ensureDir, writeFileIfAbsent, writeFile } from '../lib/scaffold';
import {
  configTemplate,
  sequenceTemplate,
  pdrTemplate,
  betDecisionTemplate,
  criteriaTemplate,
  kpiReviewTemplate,
} from '../lib/templates';

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize Open Product Primer in the current repository')
    .option('--name <name>', 'project name (defaults to directory name)')
    .action((opts) => {
      const projectRoot = process.cwd();
      const projectName = opts.name ?? path.basename(projectRoot);

      console.log(chalk.bold('Open Product Primer') + ' — initializing project workspace...\n');

      const openspec = detectOpenSpec(projectRoot);
      const graphify = detectGraphify(projectRoot);

      if (openspec.detected) console.log(chalk.green('✓') + ' OpenSpec detected');
      if (graphify.detected) console.log(chalk.green('✓') + ' Graphify detected');

      const primerDir = path.join(projectRoot, 'primer');
      ensureDir(path.join(primerDir, 'decisions'));
      ensureDir(path.join(primerDir, 'bets'));
      ensureDir(path.join(primerDir, 'reviews'));
      ensureDir(path.join(primerDir, 'templates'));

      const configWritten = writeFileIfAbsent(
        path.join(primerDir, 'config.yaml'),
        configTemplate(projectName, openspec.detected, graphify.detected)
      );
      const sequenceWritten = writeFileIfAbsent(path.join(primerDir, 'sequence.yaml'), sequenceTemplate);

      writeFile(path.join(primerDir, 'templates', 'pdr.md'), pdrTemplate);
      writeFile(path.join(primerDir, 'templates', 'bet-decision.md'), betDecisionTemplate);
      writeFile(path.join(primerDir, 'templates', 'criteria.yaml'), criteriaTemplate);
      writeFile(path.join(primerDir, 'templates', 'kpi-review.md'), kpiReviewTemplate);

      writeFileIfAbsent(path.join(primerDir, 'decisions', '.gitkeep'), '');
      writeFileIfAbsent(path.join(primerDir, 'bets', '.gitkeep'), '');
      writeFileIfAbsent(path.join(primerDir, 'reviews', '.gitkeep'), '');

      console.log('\n' + chalk.green('✓') + ' primer/ workspace created');
      const configStatus = configWritten ? 'written' : 'preserved (already exists)';
      const sequenceStatus = sequenceWritten ? 'written' : 'preserved (already exists)';
      console.log('  ' + chalk.gray('primer/config.yaml') + ' — ' + configStatus);
      console.log('  ' + chalk.gray('primer/sequence.yaml') + ' — ' + sequenceStatus);
      console.log('  ' + chalk.gray('primer/templates/') + ' — refreshed');
      console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
      console.log('Run ' + chalk.cyan('oprim update') + ' to install /oprim:* assistant commands.');
    });
}
