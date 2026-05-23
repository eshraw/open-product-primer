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
exports.measureCommand = measureCommand;
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const chalk_1 = __importDefault(require("chalk"));
const measure_1 = require("../lib/measure");
function measureCommand() {
    return new commander_1.Command('measure')
        .description('Generate and run KPI measurements for a bet')
        .argument('<bet-id>', 'BET ID (e.g. BET-042)')
        .option('--dry-run', 'generate definition files without calling APIs')
        .action(async (betId, opts) => {
        const projectRoot = process.cwd();
        const betDir = path.join(projectRoot, 'primer', 'bets', betId);
        // 1.3 — bet directory validation
        if (!fs.existsSync(betDir)) {
            console.error(chalk_1.default.red(`Bet not found: primer/bets/${betId}/`));
            console.error(`Use ${chalk_1.default.cyan('/oprim:bet')} to create the bet first.`);
            process.exit(1);
        }
        // 1.4 — criteria.yaml validation
        const criteriaPath = path.join(betDir, 'criteria.yaml');
        if (!fs.existsSync(criteriaPath)) {
            console.error(chalk_1.default.red(`No criteria.yaml found for ${betId}.`));
            console.error(`Run ${chalk_1.default.cyan('/oprim:criteria ' + betId)} to create one.`);
            process.exit(1);
        }
        let criteria;
        try {
            const raw = fs.readFileSync(criteriaPath, 'utf-8');
            const parsed = yaml.load(raw);
            if (!parsed?.metrics)
                throw new Error('Missing metrics field');
            criteria = parsed;
        }
        catch (err) {
            console.error(chalk_1.default.red(`Invalid criteria.yaml: ${err.message}`));
            process.exit(1);
        }
        // 2.5 — create measurements/ directory
        const measurementsDir = path.join(betDir, 'measurements');
        if (!fs.existsSync(measurementsDir)) {
            fs.mkdirSync(measurementsDir, { recursive: true });
        }
        console.log(chalk_1.default.bold(`oprim measure ${betId}`) + '\n');
        // 2.1–2.4 — generate definition files
        for (const metric of criteria.metrics) {
            if (metric.source.type === 'amplitude') {
                const def = (0, measure_1.generateAmplitudeDefinition)(metric);
                const outPath = path.join(measurementsDir, `amplitude-${metric.id}.json`);
                fs.writeFileSync(outPath, JSON.stringify(def, null, 2), 'utf-8');
                console.log(chalk_1.default.green('✓') + ` Generated amplitude-${metric.id}.json`);
            }
            else if (metric.source.type === 'bigquery') {
                const sql = (0, measure_1.generateBigQuerySQL)(metric);
                const outPath = path.join(measurementsDir, `bigquery-${metric.id}.sql`);
                fs.writeFileSync(outPath, sql, 'utf-8');
                console.log(chalk_1.default.green('✓') + ` Generated bigquery-${metric.id}.sql`);
            }
        }
        // 2.6 — dry-run exits after generation
        if (opts.dryRun) {
            console.log('\n' + chalk_1.default.dim('--dry-run: skipping API execution'));
            console.log(`\nDefinition files written to primer/bets/${betId}/measurements/`);
            return;
        }
        // Execute metrics sequentially
        console.log('\nExecuting metrics...');
        const results = [];
        const amplitudeKey = process.env['AMPLITUDE_API_KEY'];
        const hasGoogleCreds = !!process.env['GOOGLE_APPLICATION_CREDENTIALS'];
        for (const metric of criteria.metrics) {
            if (metric.source.type === 'amplitude') {
                results.push(await executeAmplitudeMetric(metric, measurementsDir, amplitudeKey));
            }
            else if (metric.source.type === 'bigquery') {
                results.push(await executeBigQueryMetric(metric, measurementsDir, hasGoogleCreds));
            }
        }
        // 5.2–5.3 — write run result (overwrites existing file for same date)
        const runDate = new Date().toISOString().slice(0, 10);
        (0, measure_1.writeRunResult)(betId, measurementsDir, results, runDate);
        console.log('\n' + chalk_1.default.green('✓') + ` Run result: measurements/run-${runDate}.yaml`);
        const hits = results.filter((r) => r.status === 'hit').length;
        const misses = results.filter((r) => r.status === 'missed').length;
        const pending = results.filter((r) => r.status === 'pending').length;
        console.log(`\n  ${chalk_1.default.green(`${hits} hit`)}  ${chalk_1.default.red(`${misses} missed`)}  ${chalk_1.default.yellow(`${pending} pending`)}`);
        console.log(`\nRun ${chalk_1.default.cyan('/oprim:review ' + betId)} to create a review.`);
    });
}
// ─── Amplitude execution (3.1–3.4) ───────────────────────────────────────────
async function executeAmplitudeMetric(metric, measurementsDir, apiKey) {
    // 3.1 — skip if no API key
    if (!apiKey) {
        console.log(chalk_1.default.yellow('○') + ` ${metric.name} — skipped (AMPLITUDE_API_KEY not set)`);
        return {
            id: metric.id,
            name: metric.name,
            source: 'amplitude',
            actual: null,
            target: metric.target,
            status: 'pending',
            notes: 'AMPLITUDE_API_KEY not set — metric skipped',
        };
    }
    const defPath = path.join(measurementsDir, `amplitude-${metric.id}.json`);
    try {
        // 3.2–3.3 — call API and extract scalar
        const { actual, notes } = await (0, measure_1.runAmplitudeMetric)(defPath, apiKey);
        const status = (0, measure_1.classifyStatus)(actual, metric.target);
        const icon = status === 'hit' ? chalk_1.default.green('✓') : status === 'missed' ? chalk_1.default.red('✗') : chalk_1.default.yellow('○');
        console.log(`${icon} ${metric.name}: actual=${actual ?? 'n/a'} target=${metric.target} (${status})`);
        return { id: metric.id, name: metric.name, source: 'amplitude', actual, target: metric.target, status, notes };
    }
    catch (err) {
        // 3.4 — non-2xx or network error: mark pending, continue
        const notes = `Amplitude error: ${err.message}`;
        console.log(chalk_1.default.yellow('○') + ` ${metric.name} — ${notes}`);
        return {
            id: metric.id,
            name: metric.name,
            source: 'amplitude',
            actual: null,
            target: metric.target,
            status: 'pending',
            notes,
        };
    }
}
// ─── BigQuery execution (4.1–4.4) ────────────────────────────────────────────
async function executeBigQueryMetric(metric, measurementsDir, hasCredentials) {
    // 4.1 — skip if no credentials
    if (!hasCredentials) {
        console.log(chalk_1.default.yellow('○') + ` ${metric.name} — skipped (GOOGLE_APPLICATION_CREDENTIALS not set)`);
        return {
            id: metric.id,
            name: metric.name,
            source: 'bigquery',
            actual: null,
            target: metric.target,
            status: 'pending',
            notes: 'GOOGLE_APPLICATION_CREDENTIALS not set — metric skipped',
        };
    }
    const sqlPath = path.join(measurementsDir, `bigquery-${metric.id}.sql`);
    try {
        // 4.2–4.3 — submit job, poll, extract first-row scalar
        const { actual, notes } = await (0, measure_1.runBigQueryMetric)(sqlPath);
        const status = (0, measure_1.classifyStatus)(actual, metric.target);
        const icon = status === 'hit' ? chalk_1.default.green('✓') : status === 'missed' ? chalk_1.default.red('✗') : chalk_1.default.yellow('○');
        console.log(`${icon} ${metric.name}: actual=${actual ?? 'n/a'} target=${metric.target} (${status})`);
        return { id: metric.id, name: metric.name, source: 'bigquery', actual, target: metric.target, status, notes };
    }
    catch (err) {
        // 4.4 — job failure or zero rows: mark pending, continue
        const notes = `BigQuery error: ${err.message}`;
        console.log(chalk_1.default.yellow('○') + ` ${metric.name} — ${notes}`);
        return {
            id: metric.id,
            name: metric.name,
            source: 'bigquery',
            actual: null,
            target: metric.target,
            status: 'pending',
            notes,
        };
    }
}
