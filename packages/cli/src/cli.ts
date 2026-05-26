#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { updateCommand } from './commands/update';
import { doctorCommand } from './commands/doctor';
import { measureCommand } from './commands/measure';
import pkg from '../package.json';

const program = new Command();

program
  .name('open-product-primer')
  .description('Open Product Primer — product decisions, sequencing, and KPI tracking')
  .version(pkg.version);

program.addCommand(initCommand());
program.addCommand(updateCommand());
program.addCommand(doctorCommand());
program.addCommand(measureCommand());

program.parse();
