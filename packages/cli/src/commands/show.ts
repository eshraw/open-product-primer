import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { resolveBetDirectory } from '../lib/spec-delta';
import { parseBetDecision, parsePdrFile, parseNoteFrontmatter, resolvePdrPath, resolveNotePath } from '../lib/artifacts';

interface ShowResult {
  type: 'bet' | 'decision' | 'note';
  id: string;
  path: string;
  fields: Record<string, unknown>;
  content: string;
}

function extractLinks(content: string): string | null {
  const match = content.match(/^##\s*Links\s*\n([\s\S]*?)(?=\n##\s|$)/m);
  return match ? match[1]!.trim() : null;
}

function resolveBet(projectRoot: string, idInput: string): ShowResult | null {
  for (const sub of ['pending', 'archived']) {
    const betsDir = path.join(projectRoot, 'oprim', 'bets', sub);
    const resolved = resolveBetDirectory(betsDir, idInput);
    if (!resolved) continue;

    const decisionPath = path.join(betsDir, resolved, 'bet-decision.md');
    if (!fs.existsSync(decisionPath)) continue;

    const content = fs.readFileSync(decisionPath, 'utf-8');
    const { title, status } = parseBetDecision(content);
    return {
      type: 'bet',
      id: resolved.match(/^BET-\d+/)?.[0] ?? resolved,
      path: path.relative(projectRoot, decisionPath),
      fields: { title, status, links: extractLinks(content) },
      content,
    };
  }
  return null;
}

function resolveDecision(projectRoot: string, idInput: string): ShowResult | null {
  const filePath = resolvePdrPath(projectRoot, idInput);
  if (!filePath) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const { id, title, status } = parsePdrFile(content);
  if (!id) return null;

  return {
    type: 'decision',
    id,
    path: path.relative(projectRoot, filePath),
    fields: { title, status },
    content,
  };
}

function resolveNote(projectRoot: string, idInput: string): ShowResult | null {
  const filePath = resolveNotePath(projectRoot, idInput);
  if (!filePath) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const { title, tags } = parseNoteFrontmatter(content);
  const id = path.basename(filePath).match(/^(NOTE-\d+)/)?.[1] ?? idInput;

  return {
    type: 'note',
    id,
    path: path.relative(projectRoot, filePath),
    fields: { title, tags },
    content,
  };
}

function resolveArtifact(projectRoot: string, idInput: string): ShowResult | null {
  const normalized = idInput.trim().toUpperCase();
  if (normalized.startsWith('BET')) return resolveBet(projectRoot, idInput);
  if (normalized.startsWith('PDR')) return resolveDecision(projectRoot, idInput);
  if (normalized.startsWith('NOTE')) return resolveNote(projectRoot, idInput);
  return null;
}

export function showCommand(): Command {
  return new Command('show')
    .description('Show a single oprim artifact (bet, decision, or note) resolved by ID')
    .argument('<id>', 'artifact ID, e.g. BET-030, PDR-005, or NOTE-012')
    .option('--json', 'print machine-readable JSON instead of the human-readable view')
    .action((idInput: string, opts) => {
      const projectRoot = process.cwd();
      const result = resolveArtifact(projectRoot, idInput);

      if (!result) {
        console.error(`${idInput} was not found — checked bets, decisions, and notes.`);
        process.exitCode = 1;
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify({ type: result.type, id: result.id, path: result.path, ...result.fields, content: result.content }));
        return;
      }

      console.log(chalk.bold(`${result.id}`) + chalk.dim(`  (${result.type})  ${result.path}`));
      for (const [key, value] of Object.entries(result.fields)) {
        if (value === null || value === undefined || value === '') continue;
        console.log(chalk.dim(`${key}:`) + ` ${Array.isArray(value) ? value.join(', ') : value}`);
      }
      console.log('');
      console.log(result.content);
    });
}
