import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';
import {
  CriteriaFile,
  CriteriaMetric,
  MetricResult,
  generateAmplitudeDefinition,
  generateBigQuerySQL,
  classifyStatus,
  writeRunResult,
  runAmplitudeMetric,
  runBigQueryMetric,
} from '../lib/measure';

export function measureCommand(): Command {
  return new Command('measure')
    .description('Generate and run KPI measurements for a bet')
    .argument('<bet-id>', 'BET ID (e.g. BET-042)')
    .option('--dry-run', 'generate definition files without calling APIs')
    .action(async (betId: string, opts: { dryRun?: boolean }) => {
      const projectRoot = process.cwd();
      const betDir = path.join(projectRoot, 'primer', 'bets', betId);

      // 1.3 — bet directory validation
      if (!fs.existsSync(betDir)) {
        console.error(chalk.red(`Bet not found: primer/bets/${betId}/`));
        console.error(`Use ${chalk.cyan('/oprim:bet')} to create the bet first.`);
        process.exit(1);
      }

      // 1.4 — criteria.yaml validation
      const criteriaPath = path.join(betDir, 'criteria.yaml');
      if (!fs.existsSync(criteriaPath)) {
        console.error(chalk.red(`No criteria.yaml found for ${betId}.`));
        console.error(`Run ${chalk.cyan('/oprim:criteria ' + betId)} to create one.`);
        process.exit(1);
      }

      let criteria: CriteriaFile;
      try {
        const raw = fs.readFileSync(criteriaPath, 'utf-8');
        const parsed = yaml.load(raw) as CriteriaFile;
        if (!parsed?.metrics) throw new Error('Missing metrics field');
        criteria = parsed;
      } catch (err) {
        console.error(chalk.red(`Invalid criteria.yaml: ${(err as Error).message}`));
        process.exit(1);
      }

      // 2.5 — create measurements/ directory
      const measurementsDir = path.join(betDir, 'measurements');
      if (!fs.existsSync(measurementsDir)) {
        fs.mkdirSync(measurementsDir, { recursive: true });
      }

      console.log(chalk.bold(`oprim measure ${betId}`) + '\n');

      // 2.1–2.4 — generate definition files
      for (const metric of criteria.metrics) {
        if (metric.source.type === 'amplitude') {
          const def = generateAmplitudeDefinition(metric);
          const outPath = path.join(measurementsDir, `amplitude-${metric.id}.json`);
          fs.writeFileSync(outPath, JSON.stringify(def, null, 2), 'utf-8');
          console.log(chalk.green('✓') + ` Generated amplitude-${metric.id}.json`);
        } else if (metric.source.type === 'bigquery') {
          const sql = generateBigQuerySQL(metric);
          const outPath = path.join(measurementsDir, `bigquery-${metric.id}.sql`);
          fs.writeFileSync(outPath, sql, 'utf-8');
          console.log(chalk.green('✓') + ` Generated bigquery-${metric.id}.sql`);
        }
      }

      // 2.6 — dry-run exits after generation
      if (opts.dryRun) {
        console.log('\n' + chalk.dim('--dry-run: skipping API execution'));
        console.log(`\nDefinition files written to primer/bets/${betId}/measurements/`);
        return;
      }

      // Execute metrics sequentially
      console.log('\nExecuting metrics...');

      const results: MetricResult[] = [];
      const amplitudeKey = process.env['AMPLITUDE_API_KEY'];
      const hasGoogleCreds = !!process.env['GOOGLE_APPLICATION_CREDENTIALS'];

      for (const metric of criteria.metrics) {
        if (metric.source.type === 'amplitude') {
          results.push(await executeAmplitudeMetric(metric, measurementsDir, amplitudeKey));
        } else if (metric.source.type === 'bigquery') {
          results.push(await executeBigQueryMetric(metric, measurementsDir, hasGoogleCreds));
        }
      }

      // 5.2–5.3 — write run result (overwrites existing file for same date)
      const runDate = new Date().toISOString().slice(0, 10);
      writeRunResult(betId, measurementsDir, results, runDate);

      console.log('\n' + chalk.green('✓') + ` Run result: measurements/run-${runDate}.yaml`);

      const hits = results.filter((r) => r.status === 'hit').length;
      const misses = results.filter((r) => r.status === 'missed').length;
      const pending = results.filter((r) => r.status === 'pending').length;
      console.log(
        `\n  ${chalk.green(`${hits} hit`)}  ${chalk.red(`${misses} missed`)}  ${chalk.yellow(`${pending} pending`)}`
      );
      console.log(`\nRun ${chalk.cyan('/oprim:review ' + betId)} to create a review.`);
    });
}

// ─── Amplitude execution (3.1–3.4) ───────────────────────────────────────────

async function executeAmplitudeMetric(
  metric: CriteriaMetric,
  measurementsDir: string,
  apiKey: string | undefined
): Promise<MetricResult> {
  // 3.1 — skip if no API key
  if (!apiKey) {
    console.log(chalk.yellow('○') + ` ${metric.name} — skipped (AMPLITUDE_API_KEY not set)`);
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
    const { actual, notes } = await runAmplitudeMetric(defPath, apiKey);
    const status = classifyStatus(actual, metric.target);
    const icon = status === 'hit' ? chalk.green('✓') : status === 'missed' ? chalk.red('✗') : chalk.yellow('○');
    console.log(`${icon} ${metric.name}: actual=${actual ?? 'n/a'} target=${metric.target} (${status})`);
    return { id: metric.id, name: metric.name, source: 'amplitude', actual, target: metric.target, status, notes };
  } catch (err) {
    // 3.4 — non-2xx or network error: mark pending, continue
    const notes = `Amplitude error: ${(err as Error).message}`;
    console.log(chalk.yellow('○') + ` ${metric.name} — ${notes}`);
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

async function executeBigQueryMetric(
  metric: CriteriaMetric,
  measurementsDir: string,
  hasCredentials: boolean
): Promise<MetricResult> {
  // 4.1 — skip if no credentials
  if (!hasCredentials) {
    console.log(chalk.yellow('○') + ` ${metric.name} — skipped (GOOGLE_APPLICATION_CREDENTIALS not set)`);
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
    const { actual, notes } = await runBigQueryMetric(sqlPath);
    const status = classifyStatus(actual, metric.target);
    const icon = status === 'hit' ? chalk.green('✓') : status === 'missed' ? chalk.red('✗') : chalk.yellow('○');
    console.log(`${icon} ${metric.name}: actual=${actual ?? 'n/a'} target=${metric.target} (${status})`);
    return { id: metric.id, name: metric.name, source: 'bigquery', actual, target: metric.target, status, notes };
  } catch (err) {
    // 4.4 — job failure or zero rows: mark pending, continue
    const notes = `BigQuery error: ${(err as Error).message}`;
    console.log(chalk.yellow('○') + ` ${metric.name} — ${notes}`);
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
