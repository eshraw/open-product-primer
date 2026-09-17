import { Command } from 'commander';
import chalk from 'chalk';
import { readAgentsFromConfig, readClaudeModsFromConfig } from '../lib/detect';
import {
  promptClaudeModsSelection,
  promptEnableFunctionHooks,
  isFunctionHooksActive,
  enableFunctionHooks,
  printManualFunctionHooksActivation,
  applyClaudeModsSelection,
} from '../lib/install-agent';

export function claudeModsCommand(): Command {
  return new Command('claude-mods')
    .description('Select which Claude Code function-hook mods are installed')
    .action(async () => {
      const projectRoot = process.cwd();
      const agents = readAgentsFromConfig(projectRoot);

      if (!agents || !agents.includes('claude')) {
        console.error(
          chalk.red('Claude Code is not installed in this project.') +
            ' Run ' +
            chalk.cyan('oprim init') +
            ' and select Claude Code first.'
        );
        process.exitCode = 1;
        return;
      }

      const previousMods = readClaudeModsFromConfig(projectRoot);
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

      if (selectedMods.length === 0) {
        console.log(chalk.dim('  No mods selected — any previously-installed mod hooks were removed.'));
      } else {
        console.log(chalk.green('✓') + ` Claude mods installed: ${selectedMods.join(', ')}`);
      }
    });
}
