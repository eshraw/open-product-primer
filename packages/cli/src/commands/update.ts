import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { installAgentSkills, promptAgentSelection, promptFrameworkSelection, promptPdrSurfacing, Agent } from '../lib/install-agent';
import { readAgentsFromConfig, writeAgentsToConfig } from '../lib/detect';
import { ensureDir, writeFile } from '../lib/scaffold';
import { sequenceViewScriptTemplate } from '../lib/templates';

export function updateCommand(): Command {
  return new Command('update')
    .description('Refresh /oprim:* assistant commands and skills from package templates')
    .action(async () => {
      const projectRoot = process.cwd();

      const configAgents = readAgentsFromConfig(projectRoot);

      const primerDir = path.join(projectRoot, 'oprim');
      ensureDir(path.join(primerDir, 'scripts'));
      writeFile(path.join(primerDir, 'scripts', 'generate-sequence-view.js'), sequenceViewScriptTemplate);

      if (configAgents !== null && configAgents.length > 0) {
        let specFramework = 'openspec';
        let pdrSurfacing = false;
        if (configAgents.includes('claude')) {
          specFramework = await promptFrameworkSelection(projectRoot);
          pdrSurfacing = await promptPdrSurfacing();
        }
        for (const agent of configAgents) {
          installAgentSkills(agent as Agent, projectRoot, specFramework, pdrSurfacing);
        }
        console.log(`\nAgent skills updated: ${configAgents.join(', ')}`);
      } else {
        // Legacy: fall back to directory detection
        const legacyAgents: string[] = [];

        if (fs.existsSync(path.join(projectRoot, '.claude'))) {
          const specFramework = await promptFrameworkSelection(projectRoot);
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
        console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
        return;
      }

      console.log('');
      const selected = await promptAgentSelection(projectRoot);

      if (selected.length === 0) {
        console.log('\n' + chalk.yellow('No agents selected.'));
        console.log('\nRun ' + chalk.cyan('oprim doctor') + ' to verify your setup.');
        return;
      }

      let addSpecFramework = 'openspec';
      let addPdrSurfacing = false;
      if (selected.includes('claude')) {
        addSpecFramework = await promptFrameworkSelection(projectRoot);
        addPdrSurfacing = await promptPdrSurfacing();
      }
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
