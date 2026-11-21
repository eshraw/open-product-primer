import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { installAgentSkills, promptAgentSelection, promptFrameworkSelection, promptPdrSurfacing, resolveSpecFramework, Agent } from '../lib/install-agent';
import { readAgentsFromConfig, writeAgentsToConfig, readOkfEnabledFromConfig } from '../lib/detect';
import { ensureDir, writeFile } from '../lib/scaffold';
import { sequenceViewScriptTemplate, decisionsViewScriptTemplate } from '../lib/templates';
import { mergeConfigSchema, mergePortfolioConfigSchema, mergeSpecFramework } from '../lib/config-merge';
import { readWorkspaceMode } from '../lib/workspace-mode';

// bet-023 — persist the resolved spec_framework into oprim/config.yaml, inserting it only
// when the key is missing (never overwrites an already-persisted choice).
function persistSpecFramework(configPath: string, framework: string): void {
  if (!fs.existsSync(configPath)) return;
  const existing = fs.readFileSync(configPath, 'utf-8');
  const { content, changed } = mergeSpecFramework(existing, framework);
  if (changed) {
    fs.writeFileSync(configPath, content, 'utf-8');
    console.log(chalk.green('✓') + ` oprim/config.yaml — integrations.spec_framework set to ${framework}`);
  }
}

export function updateCommand(): Command {
  return new Command('update')
    .description('Refresh /oprim:* assistant commands and skills from package templates')
    .action(async () => {
      const projectRoot = process.cwd();

      const configAgents = readAgentsFromConfig(projectRoot);

      // okf.enabled is persisted at init time; update reads it (no re-prompt) since
      // already-scaffolded oprim/templates/*.md files are never rewritten here.
      const okfEnabled = readOkfEnabledFromConfig(projectRoot);
      console.log(chalk.dim(`OKF frontmatter: ${okfEnabled ? 'enabled' : 'disabled'} (persisted from init)`));

      const primerDir = path.join(projectRoot, 'oprim');
      ensureDir(path.join(primerDir, 'scripts'));
      writeFile(path.join(primerDir, 'scripts', 'generate-sequence-view.js'), sequenceViewScriptTemplate);
      writeFile(path.join(primerDir, 'scripts', 'generate-decisions-view.js'), decisionsViewScriptTemplate);

      const configPath = path.join(primerDir, 'config.yaml');
      const portfolio = readWorkspaceMode(projectRoot) === 'portfolio';
      if (fs.existsSync(configPath)) {
        const existingConfig = fs.readFileSync(configPath, 'utf-8');
        const base = mergeConfigSchema(existingConfig);
        // BET-075 — portfolio-only keys (products:) are merged only in portfolio workspaces.
        const extra = portfolio ? mergePortfolioConfigSchema(base.content) : { content: base.content, changed: false };
        if (base.changed || extra.changed) {
          fs.writeFileSync(configPath, extra.content, 'utf-8');
          console.log(chalk.green('✓') + ' oprim/config.yaml — schema updated with new keys (existing values preserved)');
        }
      }

      // PDR-001 §5 — a portfolio never holds specs: skip the framework prompt, always `none`.
      const selectFramework = (): Promise<string> =>
        portfolio ? Promise.resolve('none') : promptFrameworkSelection(projectRoot);

      if (configAgents !== null && configAgents.length > 0) {
        let specFramework = resolveSpecFramework(projectRoot);
        let pdrSurfacing = false;
        if (configAgents.includes('claude')) {
          specFramework = await selectFramework();
          pdrSurfacing = await promptPdrSurfacing();
        }
        persistSpecFramework(configPath, specFramework);
        for (const agent of configAgents) {
          installAgentSkills(agent as Agent, projectRoot, specFramework, pdrSurfacing);
        }
        console.log(`\nAgent skills updated: ${configAgents.join(', ')}`);
      } else {
        // Legacy: fall back to directory detection
        const legacyAgents: string[] = [];

        if (fs.existsSync(path.join(projectRoot, '.claude'))) {
          const specFramework = await selectFramework();
          persistSpecFramework(configPath, specFramework);
          const pdrSurfacing = await promptPdrSurfacing();
          installAgentSkills('claude', projectRoot, specFramework, pdrSurfacing);
          legacyAgents.push('claude');
        }

        if (fs.existsSync(path.join(projectRoot, '.cursor'))) {
          installAgentSkills('cursor', projectRoot);
          legacyAgents.push('cursor');
        }

        if (legacyAgents.length > 0) {
          console.log(`\nAgent skills updated for ${legacyAgents.length} environment(s).`);
        } else {
          console.log(chalk.yellow('No agents configured or detected.'));
        }
      }

      // ── Post-update: offer to add more agents ────────────────────────────────

      const currentAgents = configAgents ?? [];
      console.log('');
      const { confirm } = await import('@inquirer/prompts');
      const addMore = await confirm({
        message: 'Would you like to install skills for additional agents?',
        default: false,
      });

      if (!addMore) {
        persistSpecFramework(configPath, resolveSpecFramework(projectRoot));
        console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
        return;
      }

      console.log('');
      const selected = await promptAgentSelection(projectRoot);

      if (selected.length === 0) {
        persistSpecFramework(configPath, resolveSpecFramework(projectRoot));
        console.log('\n' + chalk.yellow('No agents selected.'));
        console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
        return;
      }

      let addSpecFramework = resolveSpecFramework(projectRoot);
      let addPdrSurfacing = false;
      if (selected.includes('claude')) {
        addSpecFramework = await selectFramework();
        addPdrSurfacing = await promptPdrSurfacing();
      }
      persistSpecFramework(configPath, addSpecFramework);
      console.log('\n' + chalk.bold('Installing agent skills...'));
      for (const agent of selected) {
        installAgentSkills(agent as Agent, projectRoot, addSpecFramework, addPdrSurfacing);
      }

      const merged = Array.from(new Set([...currentAgents, ...selected]));
      writeAgentsToConfig(merged, projectRoot);
      console.log('\n' + chalk.green('✓') + ` Agent skills installed: ${selected.join(', ')}`);
      console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
    });
}
