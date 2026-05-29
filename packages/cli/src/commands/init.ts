import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import { detectOpenSpec, detectGraphify, readAgentsFromConfig, writeAgentsToConfig } from '../lib/detect';
import { ensureDir, writeFileIfAbsent, writeFile } from '../lib/scaffold';
import { installAgentSkills, promptAgentSelection, SUPPORTED_AGENTS, Agent } from '../lib/install-agent';
import {
  configTemplate,
  sequenceTemplate,
  pdrTemplate,
  betDecisionTemplate,
  criteriaTemplate,
  kpiReviewTemplate,
  discoveryTemplate,
} from '../lib/templates';

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize oprim in the current repository')
    .option('--name <name>', 'project name (defaults to directory name)')
    .option(
      '--agent <name>',
      'AI agent to install skills for (repeatable; supported: claude, cursor)',
      (val: string, prev: string[]) => [...prev, val],
      [] as string[]
    )
    .action(async (opts) => {
      const projectRoot = process.cwd();
      const projectName = opts.name ?? path.basename(projectRoot);

      console.log(chalk.bold('oprim') + ' — initializing project workspace...\n');

      const openspec = detectOpenSpec(projectRoot);
      const graphify = detectGraphify(projectRoot);

      if (openspec.detected) console.log(chalk.green('✓') + ' OpenSpec detected');
      if (graphify.detected) console.log(chalk.green('✓') + ' Graphify detected');

      const primerDir = path.join(projectRoot, 'oprim');
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
      writeFile(path.join(primerDir, 'templates', 'discovery.md'), discoveryTemplate);

      writeFileIfAbsent(path.join(primerDir, 'decisions', '.gitkeep'), '');
      writeFileIfAbsent(path.join(primerDir, 'bets', '.gitkeep'), '');
      writeFileIfAbsent(path.join(primerDir, 'reviews', '.gitkeep'), '');

      console.log('\n' + chalk.green('✓') + ' oprim/ workspace created');
      const configStatus = configWritten ? 'written' : 'preserved (already exists)';
      const sequenceStatus = sequenceWritten ? 'written' : 'preserved (already exists)';
      console.log('  ' + chalk.gray('oprim/config.yaml') + ' — ' + configStatus);
      console.log('  ' + chalk.gray('oprim/sequence.yaml') + ' — ' + sequenceStatus);
      console.log('  ' + chalk.gray('oprim/templates/') + ' — refreshed');

      // ── Agent selection ───────────────────────────────────────────────────────

      let selectedAgents: string[];
      const flaggedAgents: string[] = opts.agent;

      if (flaggedAgents.length > 0) {
        const invalid = flaggedAgents.filter((a) => !(SUPPORTED_AGENTS as readonly string[]).includes(a));
        if (invalid.length > 0) {
          console.error(chalk.red(`\nUnknown agent(s): ${invalid.join(', ')}`));
          console.error(`Supported agents: ${SUPPORTED_AGENTS.join(', ')}`);
          process.exit(1);
        }
        selectedAgents = flaggedAgents;
      } else {
        const existingAgents = readAgentsFromConfig(projectRoot);
        if (existingAgents !== null && existingAgents.length > 0) {
          selectedAgents = existingAgents;
          console.log('\n' + chalk.dim(`Re-installing for configured agents: ${selectedAgents.join(', ')}`));
        } else {
          console.log('');
          selectedAgents = await promptAgentSelection(projectRoot);
        }
      }

      writeAgentsToConfig(selectedAgents, projectRoot);

      if (selectedAgents.length === 0) {
        console.log(
          '\n' +
            chalk.yellow('No agents selected.') +
            ' Run ' +
            chalk.cyan('oprim update') +
            ' after configuring an AI tool to install /oprim:* skills.'
        );
      } else {
        console.log('\n' + chalk.bold('Installing agent skills...'));
        for (const agent of selectedAgents) {
          installAgentSkills(agent as Agent, projectRoot);
        }
        console.log('\n' + chalk.green('✓') + ` Agent skills installed: ${selectedAgents.join(', ')}`);
      }

      console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
    });
}
