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
function checkClaudeHooks(projectRoot, checks) {
    const hooksDir = path.join(projectRoot, '.claude', 'hooks');
    const promptSubmitPath = path.join(hooksDir, 'on-prompt-submit.sh');
    const promptSubmitExists = fs.existsSync(promptSubmitPath);
    checks.push({
        name: 'agent: Claude hook (on-prompt-submit.sh)',
        pass: promptSubmitExists,
        note: promptSubmitExists ? undefined : "Run 'oprim update' to install",
        required: false,
    });
    const stopHookPath = path.join(hooksDir, 'on-stop.sh');
    const stopHookExists = fs.existsSync(stopHookPath);
    checks.push({
        name: 'agent: Claude hook (on-stop.sh)',
        pass: stopHookExists,
        note: stopHookExists ? undefined : "Run 'oprim update' to install",
        required: false,
    });
    const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
    let promptSubmitRegistered = false;
    let stopRegistered = false;
    if (fs.existsSync(settingsPath)) {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            const hooksMap = settings.hooks;
            const userPromptSubmit = hooksMap?.UserPromptSubmit;
            promptSubmitRegistered =
                userPromptSubmit?.some((entry) => {
                    const entryHooks = entry.hooks;
                    return entryHooks?.some((h) => h.command === 'bash ".claude/hooks/on-prompt-submit.sh"');
                }) ?? false;
            const stopHooks = hooksMap?.Stop;
            stopRegistered =
                stopHooks?.some((entry) => {
                    const entryHooks = entry.hooks;
                    return entryHooks?.some((h) => h.command === 'bash ".claude/hooks/on-stop.sh"');
                }) ?? false;
        }
        catch {
            // Unreadable settings.json — treat as missing
        }
    }
    checks.push({
        name: 'agent: Claude settings.json (UserPromptSubmit hook)',
        pass: promptSubmitRegistered,
        note: promptSubmitRegistered ? undefined : "Run 'oprim update' to register",
        required: false,
    });
    checks.push({
        name: 'agent: Claude settings.json (Stop hook)',
        pass: stopRegistered,
        note: stopRegistered ? undefined : "Run 'oprim update' to register",
        required: false,
    });
}
function doctorCommand() {
    return new commander_1.Command('doctor')
        .description('Check oprim install health and integration readiness')
        .action(() => {
        const projectRoot = process.cwd();
        const checks = [];
        const primerDir = path.join(projectRoot, 'oprim');
        const legacyPrimerExists = fs.existsSync(path.join(projectRoot, 'primer'));
        const oprimExists = fs.existsSync(path.join(projectRoot, 'oprim'));
        if (legacyPrimerExists && !oprimExists) {
            checks.push({
                name: 'migration: primer/ detected',
                pass: false,
                note: "Run 'oprim migrate' to rename primer/ to oprim/",
                required: true,
            });
        }
        for (const dir of ['oprim', 'oprim/decisions', 'oprim/bets', 'oprim/reviews', 'oprim/templates']) {
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
            name: 'config: oprim/config.yaml',
            pass: configExists,
            note: configExists ? undefined : "Run 'oprim init' to create",
            required: true,
        });
        const sequenceExists = fs.existsSync(path.join(primerDir, 'sequence.yaml'));
        checks.push({
            name: 'config: oprim/sequence.yaml',
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
        // ── Discovery checks — warn if bet is missing discovery.md ───────────────
        const betsDir = path.join(primerDir, 'bets');
        if (fs.existsSync(betsDir)) {
            const betEntries = fs.readdirSync(betsDir, { withFileTypes: true });
            for (const entry of betEntries) {
                if (!entry.isDirectory())
                    continue;
                const betDir = path.join(betsDir, entry.name);
                const hasDecision = fs.existsSync(path.join(betDir, 'bet-decision.md'));
                if (!hasDecision)
                    continue;
                const hasDiscovery = fs.existsSync(path.join(betDir, 'discovery.md'));
                checks.push({
                    name: `discovery: ${entry.name}/discovery.md`,
                    pass: hasDiscovery,
                    note: hasDiscovery ? undefined : 'discovery.md missing — consider adding discovery context',
                    required: false,
                });
            }
        }
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
            if (configAgents.includes('claude')) {
                checkClaudeHooks(projectRoot, checks);
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
            // Legacy: also check hooks if .claude/ is present
            if (claudeInstalled) {
                checkClaudeHooks(projectRoot, checks);
            }
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
