#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const update_1 = require("./commands/update");
const doctor_1 = require("./commands/doctor");
const validate_1 = require("./commands/validate");
const migrate_1 = require("./commands/migrate");
const measure_1 = require("./commands/measure");
const ovw_1 = require("./commands/ovw");
const context_1 = require("./commands/context");
const list_1 = require("./commands/list");
const show_1 = require("./commands/show");
const status_1 = require("./commands/status");
const package_json_1 = __importDefault(require("../package.json"));
const program = new commander_1.Command();
program
    .name('oprim')
    .description('oprim — product decisions, sequencing, and KPI tracking')
    .version(package_json_1.default.version);
program.addCommand((0, init_1.initCommand)());
program.addCommand((0, update_1.updateCommand)());
program.addCommand((0, doctor_1.doctorCommand)());
program.addCommand((0, validate_1.validateCommand)());
program.addCommand((0, migrate_1.migrateCommand)());
program.addCommand((0, measure_1.measureCommand)());
program.addCommand((0, ovw_1.ovwCommand)());
program.addCommand((0, context_1.contextCommand)());
program.addCommand((0, list_1.listCommand)());
program.addCommand((0, show_1.showCommand)());
program.addCommand((0, status_1.statusCommand)());
program.parse();
