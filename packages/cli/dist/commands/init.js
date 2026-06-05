"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const commander_1 = require("commander");
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const detect_1 = require("../lib/detect");
const scaffold_1 = require("../lib/scaffold");
const install_agent_1 = require("../lib/install-agent");
const templates_1 = require("../lib/templates");
function initCommand() {
    return new commander_1.Command('init')
        .description('Initialize oprim in the current repository')
        .option('--name <name>', 'project name (defaults to directory name)')
        .option('--agent <name>', 'AI agent to install skills for (repeatable; supported: claude, cursor)', (val, prev) => [...prev, val], [])
        .action(async (opts) => {
        const projectRoot = process.cwd();
        const projectName = opts.name ?? path.basename(projectRoot);
        console.log(chalk_1.default.bold('oprim') + ' — initializing project workspace...\n');
        const openspec = (0, detect_1.detectOpenSpec)(projectRoot);
        const graphify = (0, detect_1.detectGraphify)(projectRoot);
        if (openspec.detected)
            console.log(chalk_1.default.green('✓') + ' OpenSpec detected');
        if (graphify.detected)
            console.log(chalk_1.default.green('✓') + ' Graphify detected');
        const primerDir = path.join(projectRoot, 'oprim');
        (0, scaffold_1.ensureDir)(path.join(primerDir, 'decisions'));
        (0, scaffold_1.ensureDir)(path.join(primerDir, 'bets'));
        (0, scaffold_1.ensureDir)(path.join(primerDir, 'reviews'));
        (0, scaffold_1.ensureDir)(path.join(primerDir, 'templates'));
        const configWritten = (0, scaffold_1.writeFileIfAbsent)(path.join(primerDir, 'config.yaml'), (0, templates_1.configTemplate)(projectName, openspec.detected, graphify.detected));
        const sequenceWritten = (0, scaffold_1.writeFileIfAbsent)(path.join(primerDir, 'sequence.yaml'), templates_1.sequenceTemplate);
        (0, scaffold_1.writeFile)(path.join(primerDir, 'templates', 'pdr.md'), templates_1.pdrTemplate);
        (0, scaffold_1.writeFile)(path.join(primerDir, 'templates', 'bet-decision.md'), templates_1.betDecisionTemplate);
        (0, scaffold_1.writeFile)(path.join(primerDir, 'templates', 'criteria.yaml'), templates_1.criteriaTemplate);
        (0, scaffold_1.writeFile)(path.join(primerDir, 'templates', 'kpi-review.md'), templates_1.kpiReviewTemplate);
        (0, scaffold_1.writeFile)(path.join(primerDir, 'templates', 'discovery.md'), templates_1.discoveryTemplate);
        (0, scaffold_1.writeFileIfAbsent)(path.join(primerDir, 'decisions', '.gitkeep'), '');
        (0, scaffold_1.writeFileIfAbsent)(path.join(primerDir, 'bets', '.gitkeep'), '');
        (0, scaffold_1.writeFileIfAbsent)(path.join(primerDir, 'reviews', '.gitkeep'), '');
        console.log('\n' + chalk_1.default.green('✓') + ' oprim/ workspace created');
        const configStatus = configWritten ? 'written' : 'preserved (already exists)';
        const sequenceStatus = sequenceWritten ? 'written' : 'preserved (already exists)';
        console.log('  ' + chalk_1.default.gray('oprim/config.yaml') + ' — ' + configStatus);
        console.log('  ' + chalk_1.default.gray('oprim/sequence.yaml') + ' — ' + sequenceStatus);
        console.log('  ' + chalk_1.default.gray('oprim/templates/') + ' — refreshed');
        // ── Agent selection ───────────────────────────────────────────────────────
        let selectedAgents;
        const flaggedAgents = opts.agent;
        if (flaggedAgents.length > 0) {
            const invalid = flaggedAgents.filter((a) => !install_agent_1.SUPPORTED_AGENTS.includes(a));
            if (invalid.length > 0) {
                console.error(chalk_1.default.red(`\nUnknown agent(s): ${invalid.join(', ')}`));
                console.error(`Supported agents: ${install_agent_1.SUPPORTED_AGENTS.join(', ')}`);
                process.exit(1);
            }
            selectedAgents = flaggedAgents;
        }
        else {
            const existingAgents = (0, detect_1.readAgentsFromConfig)(projectRoot);
            if (existingAgents !== null && existingAgents.length > 0) {
                selectedAgents = existingAgents;
                console.log('\n' + chalk_1.default.dim(`Re-installing for configured agents: ${selectedAgents.join(', ')}`));
            }
            else {
                console.log('');
                selectedAgents = await (0, install_agent_1.promptAgentSelection)(projectRoot);
            }
        }
        (0, detect_1.writeAgentsToConfig)(selectedAgents, projectRoot);
        if (selectedAgents.length === 0) {
            console.log('\n' +
                chalk_1.default.yellow('No agents selected.') +
                ' Run ' +
                chalk_1.default.cyan('oprim update') +
                ' after configuring an AI tool to install /oprim:* skills.');
        }
        else {
            let specFramework = 'openspec';
            let pdrSurfacing = false;
            if (selectedAgents.includes('claude')) {
                specFramework = await (0, install_agent_1.promptFrameworkSelection)(projectRoot);
                pdrSurfacing = await (0, install_agent_1.promptPdrSurfacing)();
            }
            console.log('\n' + chalk_1.default.bold('Installing agent skills...'));
            for (const agent of selectedAgents) {
                (0, install_agent_1.installAgentSkills)(agent, projectRoot, specFramework, pdrSurfacing);
            }
            console.log('\n' + chalk_1.default.green('✓') + ` Agent skills installed: ${selectedAgents.join(', ')}`);
        }
        console.log('\nRun ' + chalk_1.default.cyan('oprim doctor') + ' to verify your setup.');
    });
}
