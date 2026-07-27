import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import {
  readRemoteContextConfig,
  writeRemoteContextConfig,
  findSourceByName,
  readIdentity,
  writeIdentity,
  identityFilePath,
  resolveIdentityOnly,
  resolveFull,
  assembleOprimWorkspaceContent,
  isGitSource,
  type RemoteContextSource,
} from '../lib/remote-context';
import { fileExists } from '../lib/scaffold';

function sourceKind(source: RemoteContextSource): 'git' | 'path' {
  return isGitSource(source) ? 'git' : 'path';
}

function initSubcommand(): Command {
  return new Command('init')
    .description('Declare the current project as a citable remote context')
    .option('--description <text>', 'canonical description of what this context contains')
    .action((opts) => {
      const projectRoot = process.cwd();
      if (fileExists(identityFilePath(projectRoot))) {
        console.log(chalk.yellow('A remote context identity already exists at ') + chalk.cyan('.oprim-context/context.yaml'));
        return;
      }

      const name = path.basename(projectRoot);
      writeIdentity(projectRoot, { name, version: '1', description: opts.description });

      console.log(chalk.green('✓') + ' .oprim-context/context.yaml created');
      console.log(`  name: ${name}`);
      if (opts.description) {
        console.log(`  description: ${opts.description}`);
      } else {
        console.log(
          chalk.yellow('  no description set') +
            ' — other projects referencing this context via ' +
            chalk.cyan('oprim context list') +
            ' will see it as description-less.'
        );
      }
    });
}

function registerSubcommand(): Command {
  return new Command('register')
    .description('Register a remote context source in the current project')
    .option('--git <url>', 'git remote URL of the remote context')
    .option('--local <path>', 'local filesystem path of the remote context')
    .requiredOption('--name <name>', 'name to register this source under')
    .option('--description <text>', 'local note about why this source was registered')
    .action((opts) => {
      const projectRoot = process.cwd();

      if ((opts.git && opts.local) || (!opts.git && !opts.local)) {
        console.error(chalk.red('Exactly one of --git or --local is required.'));
        process.exit(1);
      }

      const config = readRemoteContextConfig(projectRoot);
      if (findSourceByName(config, opts.name)) {
        console.error(chalk.red(`A source named "${opts.name}" is already registered.`));
        process.exit(1);
      }

      const source: RemoteContextSource = opts.git
        ? { name: opts.name, git: opts.git, description: opts.description }
        : { name: opts.name, path: opts.local, description: opts.description };

      config.enabled = true;
      config.sources.push(source);
      writeRemoteContextConfig(projectRoot, config);

      console.log(chalk.green('✓') + ` Registered "${opts.name}" (${sourceKind(source)})`);

      const result = resolveIdentityOnly(source);
      if (result.error) {
        console.log(
          chalk.yellow('  Could not confirm this source yet: ') +
            result.error +
            chalk.dim(' — try `oprim context list` or `oprim doctor` to retry later.')
        );
        return;
      }

      if (result.nameMismatch) {
        console.log(
          chalk.yellow(
            `  Warning: declared name "${result.nameMismatch.declared}" does not match resolved identity name "${result.nameMismatch.resolved}".`
          )
        );
      }

      if (result.identity?.description) {
        console.log(`  ${chalk.dim('description:')} ${result.identity.description}`);
      } else {
        console.log(chalk.dim('  (no canonical description set on this source)'));
      }
    });
}

function listSubcommand(): Command {
  return new Command('list')
    .description('List every registered remote context source, without fully resolving any of them')
    .action(() => {
      const projectRoot = process.cwd();
      const config = readRemoteContextConfig(projectRoot);

      if (!config.enabled || config.sources.length === 0) {
        console.log('No remote contexts configured.');
        return;
      }

      for (const source of config.sources) {
        const kind = sourceKind(source);
        console.log(`${chalk.bold(source.name)} ${chalk.dim(`(${kind})`)}`);

        const result = resolveIdentityOnly(source);
        if (result.error) {
          console.log('  ' + chalk.red(`unresolved: ${result.error}`));
        } else {
          const desc = result.identity?.description;
          console.log('  ' + (desc ? desc : chalk.dim('no description set')));
          if (result.nameMismatch) {
            console.log(
              chalk.yellow(
                `  name mismatch: declared "${result.nameMismatch.declared}", resolved "${result.nameMismatch.resolved}"`
              )
            );
          }
        }

        if (source.description) {
          console.log('  ' + chalk.dim(`local note: ${source.description}`));
        }
        console.log('');
      }
    });
}

export function contextCommand(): Command {
  const cmd = new Command('context')
    .description('Print resolved remote context content')
    .option('--source <name>', 'limit output to a single named source')
    .action((opts) => {
      const projectRoot = process.cwd();
      const config = readRemoteContextConfig(projectRoot);

      if (!config.enabled || config.sources.length === 0) {
        console.log('No remote contexts configured.');
        return;
      }

      let sources = config.sources;
      if (opts.source) {
        const match = findSourceByName(config, opts.source);
        if (!match) {
          console.error(chalk.red(`No source named "${opts.source}" is registered.`));
          process.exit(1);
        }
        sources = [match];
      }

      for (const source of sources) {
        console.log(chalk.bold(`═══ ${source.name} ═══`));
        const result = resolveFull(source);
        if (result.error) {
          console.log(chalk.red(`  unresolved: ${result.error}`));
          continue;
        }
        if (result.stale) {
          console.log(chalk.yellow('  (stale — last successful fetch could not be refreshed)'));
        }
        if (result.nameMismatch) {
          console.log(
            chalk.yellow(
              `  name mismatch: declared "${result.nameMismatch.declared}", resolved "${result.nameMismatch.resolved}"`
            )
          );
        }
        console.log(assembleOprimWorkspaceContent(result.workspaceRoot));
        console.log('');
      }
    });

  cmd.addCommand(initSubcommand());
  cmd.addCommand(registerSubcommand());
  cmd.addCommand(listSubcommand());

  return cmd;
}
