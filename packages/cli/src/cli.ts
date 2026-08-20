#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { updateCommand } from './commands/update';
import { doctorCommand } from './commands/doctor';
import { validateCommand } from './commands/validate';
import { migrateCommand } from './commands/migrate';
import { measureCommand } from './commands/measure';
import { ovwCommand } from './commands/ovw';
import { contextCommand } from './commands/context';
import { listCommand } from './commands/list';
import { showCommand } from './commands/show';
import { statusCommand } from './commands/status';
import pkg from '../package.json';

const program = new Command();

program
  .name('oprim')
  .description('oprim — product decisions, sequencing, and KPI tracking')
  .version(pkg.version);

program.addCommand(initCommand());
program.addCommand(updateCommand());
program.addCommand(doctorCommand());
program.addCommand(validateCommand());
program.addCommand(migrateCommand());
program.addCommand(measureCommand());
program.addCommand(ovwCommand());
program.addCommand(contextCommand());
program.addCommand(listCommand());
program.addCommand(showCommand());
program.addCommand(statusCommand());

program.parse();
