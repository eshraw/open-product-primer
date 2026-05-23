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
function updateCommand() {
    return new commander_1.Command('update')
        .description('Refresh /oprim:* assistant commands and skills from package templates')
        .action(() => {
        const projectRoot = process.cwd();
        const configAgents = (0, detect_1.readAgentsFromConfig)(projectRoot);
        if (configAgents !== null && configAgents.length > 0) {
            for (const agent of configAgents) {
                (0, install_agent_1.installAgentSkills)(agent, projectRoot);
            }
            console.log(`\nAgent skills updated: ${configAgents.join(', ')}`);
        }
        else if (configAgents !== null && configAgents.length === 0) {
            console.log(chalk_1.default.yellow('No agents configured') + ' — run ' + chalk_1.default.cyan('oprim init') + ' to select agents');
        }
        else {
            // Legacy: fall back to directory detection
            let updated = 0;
            if (fs.existsSync(path.join(projectRoot, '.claude'))) {
                (0, install_agent_1.installAgentSkills)('claude', projectRoot);
                updated++;
            }
            if (fs.existsSync(path.join(projectRoot, '.cursor'))) {
                (0, install_agent_1.installAgentSkills)('cursor', projectRoot);
                updated++;
            }
            if (updated === 0) {
                console.log(chalk_1.default.yellow('No assistant environments detected (.claude/, .cursor/).'));
                console.log('Run this command from a repository where AI tools are configured.');
            }
            else {
                console.log(`\nAgent skills updated for ${updated} environment(s).`);
            }
        }
    });
}
