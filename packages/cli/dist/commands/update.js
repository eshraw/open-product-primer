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
exports.updateCommand = updateCommand;
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const install_agent_1 = require("../lib/install-agent");
const detect_1 = require("../lib/detect");
const scaffold_1 = require("../lib/scaffold");
const templates_1 = require("../lib/templates");
function updateCommand() {
    return new commander_1.Command('update')
        .description('Refresh /oprim:* assistant commands and skills from package templates')
        .action(async () => {
        const projectRoot = process.cwd();
        const configAgents = (0, detect_1.readAgentsFromConfig)(projectRoot);
        const primerDir = path.join(projectRoot, 'oprim');
        (0, scaffold_1.ensureDir)(path.join(primerDir, 'scripts'));
        (0, scaffold_1.writeFile)(path.join(primerDir, 'scripts', 'generate-sequence-view.js'), templates_1.sequenceViewScriptTemplate);
        if (configAgents !== null && configAgents.length > 0) {
            let specFramework = 'openspec';
            let pdrSurfacing = false;
            if (configAgents.includes('claude')) {
                specFramework = await (0, install_agent_1.promptFrameworkSelection)(projectRoot);
                pdrSurfacing = await (0, install_agent_1.promptPdrSurfacing)();
            }
            for (const agent of configAgents) {
                (0, install_agent_1.installAgentSkills)(agent, projectRoot, specFramework, pdrSurfacing);
            }
            console.log(`\nAgent skills updated: ${configAgents.join(', ')}`);
        }
        else {
            // Legacy: fall back to directory detection
            const legacyAgents = [];
            if (fs.existsSync(path.join(projectRoot, '.claude'))) {
                const specFramework = await (0, install_agent_1.promptFrameworkSelection)(projectRoot);
                const pdrSurfacing = await (0, install_agent_1.promptPdrSurfacing)();
                (0, install_agent_1.installAgentSkills)('claude', projectRoot, specFramework, pdrSurfacing);
                legacyAgents.push('claude');
            }
            if (fs.existsSync(path.join(projectRoot, '.cursor'))) {
                (0, install_agent_1.installAgentSkills)('cursor', projectRoot);
                legacyAgents.push('cursor');
            }
            if (legacyAgents.length > 0) {
                console.log(`\nAgent skills updated for ${legacyAgents.length} environment(s).`);
            }
            else {
                console.log(chalk_1.default.yellow('No agents configured or detected.'));
            }
        }
        // ── Post-update: offer to add more agents ────────────────────────────────
        const currentAgents = configAgents ?? [];
        console.log('');
        const { confirm } = await Promise.resolve().then(() => __importStar(require('@inquirer/prompts')));
        const addMore = await confirm({
            message: 'Would you like to install skills for additional agents?',
            default: false,
        });
        if (!addMore) {
            console.log('\nRun ' + chalk_1.default.cyan('oprim doctor') + ' to verify your setup.');
            return;
        }
        console.log('');
        const selected = await (0, install_agent_1.promptAgentSelection)(projectRoot);
        if (selected.length === 0) {
            console.log('\n' + chalk_1.default.yellow('No agents selected.'));
            console.log('\nRun ' + chalk_1.default.cyan('oprim doctor') + ' to verify your setup.');
            return;
        }
        let addSpecFramework = 'openspec';
        let addPdrSurfacing = false;
        if (selected.includes('claude')) {
            addSpecFramework = await (0, install_agent_1.promptFrameworkSelection)(projectRoot);
            addPdrSurfacing = await (0, install_agent_1.promptPdrSurfacing)();
        }
        console.log('\n' + chalk_1.default.bold('Installing agent skills...'));
        for (const agent of selected) {
            (0, install_agent_1.installAgentSkills)(agent, projectRoot, addSpecFramework, addPdrSurfacing);
        }
        const merged = Array.from(new Set([...currentAgents, ...selected]));
        (0, detect_1.writeAgentsToConfig)(merged, projectRoot);
        console.log('\n' + chalk_1.default.green('✓') + ` Agent skills installed: ${selected.join(', ')}`);
        console.log('\nRun ' + chalk_1.default.cyan('oprim doctor') + ' to verify your setup.');
    });
}
