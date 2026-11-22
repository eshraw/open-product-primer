import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { detectOpenSpec, detectGraphify, readAgentsFromConfig, writeAgentsToConfig, readClaudeModsFromConfig } from '../lib/detect';
import { ensureDir, writeFileIfAbsent, writeFile } from '../lib/scaffold';
import {
  installAgentSkills,
  promptAgentSelection,
  promptFrameworkSelection,
  promptPdrSurfacing,
  promptOkfFrontmatter,
  promptClaudeModsSelection,
  promptEnableFunctionHooks,
  isFunctionHooksActive,
  enableFunctionHooks,
  printManualFunctionHooksActivation,
  applyClaudeModsSelection,
  SUPPORTED_AGENTS,
  Agent,
} from '../lib/install-agent';
import {
  configTemplate,
  sequenceTemplate,
  pdrTemplate,
  betDecisionTemplate,
  criteriaTemplate,
  kpiReviewTemplate,
  discoveryTemplate,
  sequenceViewScriptTemplate,
  decisionsViewScriptTemplate,
  okfFrontmatter,
  indexTemplate,
  noteTemplate,
  noteMinimalFrontmatter,
} from '../lib/templates';
import { readWorkspaceMode, isWorkspaceMode, WORKSPACE_MODES, type WorkspaceMode } from '../lib/workspace-mode';
import { portfolioConfigTemplate } from '../lib/portfolio/templates';
import { scaffoldPortfolio } from '../lib/portfolio/scaffold';

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize oprim in the current repository')
    .option('--name <name>', 'project name (defaults to directory name)')
    .option(
      '--agent <name>',
      'AI agent to install skills for (repeatable; supported: claude, cursor, codex, gemini, poolside, vibe, qwen, kimi, dsh)',
      (val: string, prev: string[]) => [...prev, val],
      [] as string[]
    )
    .option('--mode <mode>', 'workspace mode: product (default) or portfolio')
    .action(async (opts) => {
      const projectRoot = process.cwd();
      const projectName = opts.name ?? path.basename(projectRoot);

      // BET-075 — an explicit --mode must agree with an existing config; without --mode, a
      // re-run keeps whatever mode the workspace already has (absent config/key → product).
      if (opts.mode !== undefined && !isWorkspaceMode(opts.mode)) {
        console.error(chalk.red(`\nUnknown mode: ${opts.mode}`));
        console.error(`Supported modes: ${WORKSPACE_MODES.join(', ')}`);
        process.exit(1);
      }
      const existingConfig = fs.existsSync(path.join(projectRoot, 'oprim', 'config.yaml'));
      const existingMode = readWorkspaceMode(projectRoot);
      if (opts.mode !== undefined && existingConfig && opts.mode !== existingMode) {
        console.error(
          chalk.red(`\noprim/config.yaml already exists in ${existingMode} mode; refusing to re-init as ${opts.mode}.`)
        );
        console.error('Converting an existing workspace between modes is not supported.');
        process.exit(1);
      }
      const mode: WorkspaceMode = (opts.mode as WorkspaceMode | undefined) ?? existingMode;
      const portfolio = mode === 'portfolio';

      console.log(chalk.bold('oprim') + ' — initializing project workspace...\n');

      const openspec = detectOpenSpec(projectRoot);
      const graphify = detectGraphify(projectRoot);

      if (openspec.detected) console.log(chalk.green('✓') + ' OpenSpec detected');
      if (graphify.detected) console.log(chalk.green('✓') + ' Graphify detected');

      console.log('');
      const okfEnabled = await promptOkfFrontmatter();
      // PDR-001 §5 — a portfolio never holds specs, so it never asks for a framework.
      const specFramework = portfolio ? 'none' : await promptFrameworkSelection(projectRoot);

      const primerDir = path.join(projectRoot, 'oprim');
      ensureDir(path.join(primerDir, 'decisions'));
      ensureDir(path.join(primerDir, 'bets', 'pending'));
      ensureDir(path.join(primerDir, 'reviews'));
      ensureDir(path.join(primerDir, 'notes'));
      ensureDir(path.join(primerDir, 'templates'));
      ensureDir(path.join(primerDir, 'scripts'));

      const configWritten = writeFileIfAbsent(
        path.join(primerDir, 'config.yaml'),
        portfolio
          ? portfolioConfigTemplate(projectName, openspec.detected, graphify.detected, okfEnabled)
          : configTemplate(projectName, openspec.detected, graphify.detected, okfEnabled, specFramework)
      );
      const sequenceWritten = writeFileIfAbsent(path.join(primerDir, 'sequence.yaml'), sequenceTemplate);

      const pdrContent = okfEnabled ? okfFrontmatter('pdr', '<Decision title>') + pdrTemplate : pdrTemplate;
      const betContent = okfEnabled
        ? okfFrontmatter('bet-decision', '<Bet title>') + betDecisionTemplate
        : betDecisionTemplate;
      const kpiContent = okfEnabled
        ? okfFrontmatter('kpi-review', 'KPI Review: BET-XXX') + kpiReviewTemplate
        : kpiReviewTemplate;
      // Notes always carry frontmatter — minimal tier by default, OKF tier (adds `description`)
      // when opted in — unlike the other three templates, which have no frontmatter when disabled.
      const noteContent = okfEnabled
        ? okfFrontmatter('note', '<Note title>') + noteTemplate
        : noteMinimalFrontmatter('<Note title>') + noteTemplate;

      writeFile(path.join(primerDir, 'templates', 'pdr.md'), pdrContent);
      writeFile(path.join(primerDir, 'templates', 'bet-decision.md'), betContent);
      writeFile(path.join(primerDir, 'templates', 'criteria.yaml'), criteriaTemplate);
      writeFile(path.join(primerDir, 'templates', 'kpi-review.md'), kpiContent);
      writeFile(path.join(primerDir, 'templates', 'discovery.md'), discoveryTemplate);
      writeFile(path.join(primerDir, 'templates', 'note.md'), noteContent);
      writeFile(path.join(primerDir, 'scripts', 'generate-sequence-view.js'), sequenceViewScriptTemplate);
      writeFile(path.join(primerDir, 'scripts', 'generate-decisions-view.js'), decisionsViewScriptTemplate);

      if (okfEnabled) {
        writeFile(path.join(primerDir, 'index.md'), indexTemplate(projectName));
      }

      writeFileIfAbsent(path.join(primerDir, 'decisions', '.gitkeep'), '');
      writeFileIfAbsent(path.join(primerDir, 'bets', 'pending', '.gitkeep'), '');
      writeFileIfAbsent(path.join(primerDir, 'reviews', '.gitkeep'), '');
      writeFileIfAbsent(path.join(primerDir, 'notes', '.gitkeep'), '');

      console.log('\n' + chalk.green('✓') + ' oprim/ workspace created');
      const configStatus = configWritten ? 'written' : 'preserved (already exists)';
      const sequenceStatus = sequenceWritten ? 'written' : 'preserved (already exists)';
      console.log('  ' + chalk.gray('oprim/config.yaml') + ' — ' + configStatus);
      console.log('  ' + chalk.gray('oprim/sequence.yaml') + ' — ' + sequenceStatus);
      console.log('  ' + chalk.gray('oprim/templates/') + ' — refreshed');
      console.log('  ' + chalk.gray('oprim/scripts/') + ' — refreshed');
      console.log('  ' + chalk.gray('OKF frontmatter') + ' — ' + (okfEnabled ? 'enabled' : 'disabled'));

      if (portfolio) {
        const written = scaffoldPortfolio(projectRoot, { okf: okfEnabled });
        console.log(chalk.green('✓') + ' portfolio workspace scaffolded (mode: portfolio, spec_framework: none)');
        console.log('  ' + chalk.gray('oprim/handbook/, oprim/objectives/') + ' — citable by products via remote context');
        console.log('  ' + chalk.gray('STATE.md, inbox.md, wiki/, outputs/') + ' — personal, never exported');
        if (written.length === 0) console.log('  ' + chalk.dim('all portfolio files already existed — preserved'));
      }

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
        let pdrSurfacing = false;
        if (selectedAgents.includes('claude')) {
          pdrSurfacing = await promptPdrSurfacing();
        }
        console.log('\n' + chalk.bold('Installing agent skills...'));
        for (const agent of selectedAgents) {
          installAgentSkills(agent as Agent, projectRoot, specFramework, pdrSurfacing);
        }
        console.log('\n' + chalk.green('✓') + ` Agent skills installed: ${selectedAgents.join(', ')}`);

        if (selectedAgents.includes('claude')) {
          const previousMods = readClaudeModsFromConfig(projectRoot);
          console.log('');
          const selectedMods = await promptClaudeModsSelection(previousMods);
          if (selectedMods.length > 0 && !isFunctionHooksActive(projectRoot)) {
            const enable = await promptEnableFunctionHooks();
            if (enable) {
              enableFunctionHooks(projectRoot);
              console.log(chalk.green('✓') + ' .claude/settings.json (function hooks enabled)');
            } else {
              printManualFunctionHooksActivation();
            }
          }
          applyClaudeModsSelection(projectRoot, selectedMods, previousMods);
        }
      }

      console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
      console.log(
        '\n' +
          chalk.bold('Next:') +
          ' capture your first product decision. A bet is a time-bound commitment — what you\'re building, why now, and what would make you stop.' +
          '\nOpen your AI agent and run ' +
          chalk.cyan('/oprim:bet') +
          ' to create one.'
      );
    });
}
