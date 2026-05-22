import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { installAgentSkills, Agent } from '../lib/install-agent';
import { readAgentsFromConfig } from '../lib/detect';

export function updateCommand(): Command {
  return new Command('update')
    .description('Refresh /oprim:* assistant commands and skills from package templates')
    .action(() => {
      const projectRoot = process.cwd();

      const configAgents = readAgentsFromConfig(projectRoot);

      if (configAgents !== null && configAgents.length > 0) {
        for (const agent of configAgents) {
          installAgentSkills(agent as Agent, projectRoot);
        }
        console.log(`\nAgent skills updated: ${configAgents.join(', ')}`);
      } else if (configAgents !== null && configAgents.length === 0) {
        console.log(chalk.yellow('No agents configured') + ' — run ' + chalk.cyan('oprim init') + ' to select agents');
      } else {
        // Legacy: fall back to directory detection
        let updated = 0;

        if (fs.existsSync(path.join(projectRoot, '.claude'))) {
          installAgentSkills('claude', projectRoot);
          updated++;
        }

        if (fs.existsSync(path.join(projectRoot, '.cursor'))) {
          installAgentSkills('cursor', projectRoot);
          updated++;
        }

        if (updated === 0) {
          console.log(chalk.yellow('No assistant environments detected (.claude/, .cursor/).'));
          console.log('Run this command from a repository where AI tools are configured.');
        } else {
          console.log(`\nAgent skills updated for ${updated} environment(s).`);
        }
      }
    });
}
