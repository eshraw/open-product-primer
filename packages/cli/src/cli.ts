#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { updateCommand } from './commands/update';
import { doctorCommand } from './commands/doctor';
import { migrateCommand } from './commands/migrate';
import { measureCommand } from './commands/measure';
import { ovwCommand } from './commands/ovw';
import pkg from '../package.json';

const program = new Command();

program
  .name('oprim')
  .description('oprim — product decisions, sequencing, and KPI tracking')
  .version(pkg.version);

program.addCommand(initCommand());
program.addCommand(updateCommand());
program.addCommand(doctorCommand());
program.addCommand(migrateCommand());
program.addCommand(measureCommand());
program.addCommand(ovwCommand());

program.parse();
