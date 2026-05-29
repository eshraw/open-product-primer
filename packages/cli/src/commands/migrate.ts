import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

export function migrateCommand(): Command {
  return new Command('migrate')
    .description('Rename primer/ to oprim/ in the current repository')
    .action(() => {
      const projectRoot = process.cwd();
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
