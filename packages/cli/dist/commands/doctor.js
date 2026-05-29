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
exports.doctorCommand = doctorCommand;
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const detect_1 = require("../lib/detect");
const measure_1 = require("../lib/measure");
const AGENT_DIRS = {
    claude: '.claude',
    cursor: '.cursor',
};
function doctorCommand() {
    return new commander_1.Command('doctor')
        .description('Check oprim install health and integration readiness')
        .action(() => {
        const projectRoot = process.cwd();
        const checks = [];
        const primerDir = path.join(projectRoot, 'primer');
        for (const dir of ['primer', 'primer/decisions', 'primer/bets', 'primer/reviews', 'primer/templates']) {
            const exists = fs.existsSync(path.join(projectRoot, dir));
            checks.push({
                name: `scaffold: ${dir}/`,
                pass: exists,
                note: exists ? undefined : "Run 'oprim init' to create",
                required: true,
            });
        }
        const configPath = path.join(primerDir, 'config.yaml');
        const configExists = fs.existsSync(configPath);
        checks.push({
            name: 'config: primer/config.yaml',
            pass: configExists,
            note: configExists ? undefined : "Run 'oprim init' to create",
            required: true,
        });
        const sequenceExists = fs.existsSync(path.join(primerDir, 'sequence.yaml'));
        checks.push({
            name: 'config: primer/sequence.yaml',
            pass: sequenceExists,
            note: sequenceExists ? undefined : "Run 'oprim init' to create",
            required: true,
        });
        const openspecPresent = fs.existsSync(path.join(projectRoot, 'openspec'));
        checks.push({
            name: 'integration: OpenSpec',
            pass: openspecPresent,
            note: openspecPresent ? undefined : 'Optional — install OpenSpec to enable change linking',
            required: false,
        });
        const graphifyPresent = fs.existsSync(path.join(projectRoot, 'graphify-out'));
        checks.push({
            name: 'integration: Graphify',
            pass: graphifyPresent,
            note: graphifyPresent ? undefined : 'Optional — install Graphify for traceability',
            required: false,
        });
        // 7.1–7.3: criteria-aware credential checks
        const hasAmplitudeMetrics = (0, measure_1.scanCriteriaForSourceType)(projectRoot, 'amplitude');
        const hasBigQueryMetrics = (0, measure_1.scanCriteriaForSourceType)(projectRoot, 'bigquery');
        const amplitudeKeySet = !!process.env['AMPLITUDE_API_KEY'];
        const googleCredsSet = !!process.env['GOOGLE_APPLICATION_CREDENTIALS'];
        checks.push({
            name: 'measurement: AMPLITUDE_API_KEY',
            pass: !hasAmplitudeMetrics || amplitudeKeySet,
            note: hasAmplitudeMetrics && !amplitudeKeySet
                ? 'Required for amplitude metrics — set AMPLITUDE_API_KEY to enable oprim measure'
                : hasAmplitudeMetrics
                    ? undefined
                    : 'No amplitude metrics in criteria.yaml — not required',
            required: false,
        });
        checks.push({
            name: 'measurement: GOOGLE_APPLICATION_CREDENTIALS',
            pass: !hasBigQueryMetrics || googleCredsSet,
            note: hasBigQueryMetrics && !googleCredsSet
                ? 'Required for bigquery metrics — set GOOGLE_APPLICATION_CREDENTIALS to enable oprim measure'
                : hasBigQueryMetrics
                    ? undefined
                    : 'No bigquery metrics in criteria.yaml — not required',
            required: false,
        });
        // ── Agent environment checks ──────────────────────────────────────────────
        const configAgents = (0, detect_1.readAgentsFromConfig)(projectRoot);
        if (configAgents !== null) {
            // Config-declared agents: check each declared agent's directory exists
            for (const agent of configAgents) {
                const dir = AGENT_DIRS[agent];
                if (!dir)
                    continue;
                const exists = fs.existsSync(path.join(projectRoot, dir));
                checks.push({
                    name: `agent: ${agent} environment (${dir}/)`,
                    pass: exists,
                    note: exists
                        ? undefined
                        : `${dir}/ directory not found — declared in config but missing`,
                    required: false,
                });
            }
        }
        else {
            // Legacy: check for installed commands by directory presence
            const claudeInstalled = fs.existsSync(path.join(projectRoot, '.claude', 'commands', 'oprim'));
            checks.push({
                name: 'agent: Claude /oprim:* commands',
                pass: claudeInstalled,
                note: claudeInstalled ? undefined : "Run 'oprim update' to install",
                required: false,
            });
            const cursorInstalled = fs.existsSync(path.join(projectRoot, '.cursor', 'commands', 'oprim-promote.md')) ||
                fs.existsSync(path.join(projectRoot, '.cursor', 'commands', 'oprim-sequence.md'));
            checks.push({
                name: 'agent: Cursor /oprim-* commands',
                pass: cursorInstalled,
                note: cursorInstalled ? undefined : "Run 'oprim update' to install",
                required: false,
            });
        }
        console.log(chalk_1.default.bold('oprim') + ' — health check\n');
        for (const check of checks) {
            const icon = check.pass ? chalk_1.default.green('✓') : check.required ? chalk_1.default.red('✗') : chalk_1.default.yellow('○');
            const label = check.pass ? chalk_1.default.white(check.name) : chalk_1.default.gray(check.name);
            const note = check.note ? chalk_1.default.dim(`  (${check.note})`) : '';
            console.log(`  ${icon} ${label}${note}`);
        }
        const passed = checks.filter((c) => c.pass).length;
        const requiredFailed = checks.filter((c) => c.required && !c.pass).length;
        console.log(`\n${passed}/${checks.length} checks passed.`);
        if (requiredFailed === 0) {
            console.log(chalk_1.default.green('Core setup is healthy.'));
        }
        else {
            console.log(chalk_1.default.yellow(`${requiredFailed} required check(s) failed. Run `) +
                chalk_1.default.cyan('oprim init') +
                chalk_1.default.yellow(' to fix.'));
        }
    });
}
