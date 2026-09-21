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
    .option(
      '-u, --update',
      'reinstall currently-selected mods with the latest bundled content, without changing the selection'
    )
    .action(async (options: { update?: boolean }) => {
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

      if (options.update) {
        if (previousMods.length === 0) {
          console.log(chalk.dim('  No mods installed — nothing to update.'));
          return;
        }
        applyClaudeModsSelection(projectRoot, previousMods, previousMods, { force: true });
        console.log(chalk.green('✓') + ` Claude mods reinstalled: ${previousMods.join(', ')}`);
        return;
      }

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
