#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const update_1 = require("./commands/update");
const doctor_1 = require("./commands/doctor");
const measure_1 = require("./commands/measure");
const program = new commander_1.Command();
program
    .name('open-product-primer')
    .description('Open Product Primer — product decisions, sequencing, and KPI tracking')
    .version('0.1.0');
program.addCommand((0, init_1.initCommand)());
program.addCommand((0, update_1.updateCommand)());
program.addCommand((0, doctor_1.doctorCommand)());
program.addCommand((0, measure_1.measureCommand)());
program.parse();
