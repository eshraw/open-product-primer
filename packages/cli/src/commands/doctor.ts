import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { readAgentsFromConfig } from '../lib/detect';
import { scanCriteriaForSourceType } from '../lib/measure';

interface Check {
  name: string;
  pass: boolean;
  note?: string;
  required: boolean;
}

const AGENT_DIRS: Record<string, string> = {
  claude: '.claude',
  cursor: '.cursor',
};

function checkClaudeHooks(projectRoot: string, checks: Check[]): void {
  const hookPath = path.join(projectRoot, '.claude', 'hooks', 'on-skill-archive.sh');
  const hookExists = fs.existsSync(hookPath);
  checks.push({
    name: 'agent: Claude hook (on-skill-archive.sh)',
    pass: hookExists,
    note: hookExists ? undefined : "Run 'oprim update' to install",
    required: false,
  });

  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  let hookRegistered = false;
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
      const postToolUse = (settings.hooks as Record<string, unknown> | undefined)?.PostToolUse as
        | Array<Record<string, unknown>>
        | undefined;
      const hookCommand = 'bash ".claude/hooks/on-skill-archive.sh"';
      hookRegistered =
        postToolUse?.some((entry) => {
          const entryHooks = entry.hooks as Array<Record<string, unknown>> | undefined;
          return entryHooks?.some((h) => h.command === hookCommand);
        }) ?? false;
    } catch {
      // Unreadable settings.json — treat as missing
    }
  }
  checks.push({
    name: 'agent: Claude settings.json (PostToolUse hook)',
    pass: hookRegistered,
    note: hookRegistered ? undefined : "Run 'oprim update' to register the hook",
    required: false,
  });
}

export function doctorCommand(): Command {
  return new Command('doctor')
    .description('Check oprim install health and integration readiness')
    .action(() => {
      const projectRoot = process.cwd();
      const checks: Check[] = [];

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
      const hasAmplitudeMetrics = scanCriteriaForSourceType(projectRoot, 'amplitude');
      const hasBigQueryMetrics = scanCriteriaForSourceType(projectRoot, 'bigquery');
      const amplitudeKeySet = !!process.env['AMPLITUDE_API_KEY'];
      const googleCredsSet = !!process.env['GOOGLE_APPLICATION_CREDENTIALS'];

      checks.push({
        name: 'measurement: AMPLITUDE_API_KEY',
        pass: !hasAmplitudeMetrics || amplitudeKeySet,
        note:
          hasAmplitudeMetrics && !amplitudeKeySet
            ? 'Required for amplitude metrics — set AMPLITUDE_API_KEY to enable oprim measure'
            : hasAmplitudeMetrics
              ? undefined
              : 'No amplitude metrics in criteria.yaml — not required',
        required: false,
      });

      checks.push({
        name: 'measurement: GOOGLE_APPLICATION_CREDENTIALS',
        pass: !hasBigQueryMetrics || googleCredsSet,
        note:
          hasBigQueryMetrics && !googleCredsSet
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
          if (!entry.isDirectory()) continue;
          const betDir = path.join(betsDir, entry.name);
          const hasDecision = fs.existsSync(path.join(betDir, 'bet-decision.md'));
          if (!hasDecision) continue;
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
      const configAgents = readAgentsFromConfig(projectRoot);

      if (configAgents !== null) {
        // Config-declared agents: check each declared agent's directory exists
        for (const agent of configAgents) {
          const dir = AGENT_DIRS[agent];
          if (!dir) continue;
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
      } else {
        // Legacy: check for installed commands by directory presence
        const claudeInstalled = fs.existsSync(path.join(projectRoot, '.claude', 'commands', 'oprim'));
        checks.push({
          name: 'agent: Claude /oprim:* commands',
          pass: claudeInstalled,
          note: claudeInstalled ? undefined : "Run 'oprim update' to install",
          required: false,
        });

        const cursorInstalled =
          fs.existsSync(path.join(projectRoot, '.cursor', 'commands', 'oprim-promote.md')) ||
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

      console.log(chalk.bold('oprim') + ' — health check\n');

      for (const check of checks) {
        const icon = check.pass ? chalk.green('✓') : check.required ? chalk.red('✗') : chalk.yellow('○');
        const label = check.pass ? chalk.white(check.name) : chalk.gray(check.name);
        const note = check.note ? chalk.dim(`  (${check.note})`) : '';
        console.log(`  ${icon} ${label}${note}`);
      }

      const passed = checks.filter((c) => c.pass).length;
      const requiredFailed = checks.filter((c) => c.required && !c.pass).length;
      console.log(`\n${passed}/${checks.length} checks passed.`);

      if (requiredFailed === 0) {
        console.log(chalk.green('Core setup is healthy.'));
      } else {
        console.log(
          chalk.yellow(`${requiredFailed} required check(s) failed. Run `) +
            chalk.cyan('oprim init') +
            chalk.yellow(' to fix.')
        );
      }
    });
}
