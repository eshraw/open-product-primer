import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface BetSummary {
  id: string;
  title: string;
  status: string | null;
  path: string;
}

export interface DecisionSummary {
  id: string;
  title: string;
  status: string | null;
  path: string;
}

export interface NoteSummary {
  id: string;
  title: string;
  tags: string[];
  path: string;
}

function extractBetId(dirName: string): string {
  return dirName.match(/^BET-\d+/)?.[0] ?? dirName;
}

/** Parses a bet-decision.md body for its title and `- Decision: <status>` line. */
export function parseBetDecision(content: string): { title: string; status: string | null } {
  const titleMatch = content.match(/^#\s*Decision:\s*BET-\d+\s+(.*)$/m);
  const statusMatch = content.match(/^-\s*Decision:\s*(.+)$/m);
  return {
    title: titleMatch ? titleMatch[1]!.trim() : '',
    status: statusMatch ? statusMatch[1]!.trim() : null,
  };
}

/** Enumerates bets under oprim/bets/pending/ and oprim/bets/archived/. */
export function listBets(projectRoot: string): BetSummary[] {
  const results: BetSummary[] = [];
  for (const sub of ['pending', 'archived']) {
    const dir = path.join(projectRoot, 'oprim', 'bets', sub);
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const entry of entries) {
      const decisionPath = path.join(dir, entry.name, 'bet-decision.md');
      if (!fs.existsSync(decisionPath)) continue;
      const content = fs.readFileSync(decisionPath, 'utf-8');
      const { title, status } = parseBetDecision(content);
      results.push({
        id: extractBetId(entry.name),
        title,
        status,
        path: path.relative(projectRoot, decisionPath),
      });
    }
  }
  return results;
}

/** Parses a PDR file for its id, title, and status (ported from decisionsViewScriptTemplate). */
export function parsePdrFile(content: string): { id: string | null; title: string; status: string | null } {
  const idMatch = content.match(/^#\s*(PDR-\d+)[:\s]*(.*)$/m);
  const id = idMatch ? idMatch[1]! : null;
  const title = idMatch ? idMatch[2]!.trim() : '';

  const statusMatch = content.match(/^##\s*Status\s*\n(.+)$/m) ?? content.match(/^Status:\s*(.+)$/m);
  const status = statusMatch ? statusMatch[1]!.trim() : null;

  return { id, title, status };
}

/** Enumerates decisions (PDRs) under oprim/decisions/. */
export function listDecisions(projectRoot: string): DecisionSummary[] {
  const dir = path.join(projectRoot, 'oprim', 'decisions');
  if (!fs.existsSync(dir)) return [];

  const results: DecisionSummary[] = [];
  const files = fs.readdirSync(dir).filter((f) => /^PDR-\d+.*\.md$/.test(f));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { id, title, status } = parsePdrFile(content);
    if (!id) continue;
    results.push({ id, title, status, path: path.relative(projectRoot, filePath) });
  }
  return results;
}

/** Parses a note's frontmatter (title, tags) — falls back to empty values if frontmatter is absent/unparsable. */
export function parseNoteFrontmatter(content: string): { title: string; tags: string[] } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { title: '', tags: [] };
  try {
    const fm = (yaml.load(fmMatch[1]!) ?? {}) as { title?: string; tags?: string[] };
    return { title: fm.title ?? '', tags: fm.tags ?? [] };
  } catch {
    return { title: '', tags: [] };
  }
}

/** Enumerates notes under oprim/notes/. */
export function listNotes(projectRoot: string): NoteSummary[] {
  const dir = path.join(projectRoot, 'oprim', 'notes');
  if (!fs.existsSync(dir)) return [];

  const results: NoteSummary[] = [];
  const files = fs.readdirSync(dir).filter((f) => /^NOTE-\d+.*\.md$/.test(f));
  for (const file of files) {
    const idMatch = file.match(/^(NOTE-\d+)/);
    if (!idMatch) continue;
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { title, tags } = parseNoteFrontmatter(content);
    results.push({ id: idMatch[1]!, title, tags, path: path.relative(projectRoot, filePath) });
  }
  return results;
}

function normalizeArtifactId(prefix: string, input: string): string {
  const digits = input.replace(/[^0-9]/g, '');
  return `${prefix}-${digits.padStart(3, '0')}`;
}

function resolveByPrefix(dir: string, id: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  const exact = files.find((f) => f === `${id}.md`);
  if (exact) return path.join(dir, exact);

  const slugMatches = files.filter((f) => f.startsWith(`${id}-`));
  if (slugMatches.length === 1) return path.join(dir, slugMatches[0]!);

  return null;
}

/** Resolves a PDR ID (accepting `pdr-005`, `005`, `5`, or `PDR-005`) to its file path under oprim/decisions/. */
export function resolvePdrPath(projectRoot: string, idInput: string): string | null {
  return resolveByPrefix(path.join(projectRoot, 'oprim', 'decisions'), normalizeArtifactId('PDR', idInput));
}

/** Resolves a note ID (accepting `note-005`, `005`, `5`, or `NOTE-005`) to its file path under oprim/notes/. */
export function resolveNotePath(projectRoot: string, idInput: string): string | null {
  return resolveByPrefix(path.join(projectRoot, 'oprim', 'notes'), normalizeArtifactId('NOTE', idInput));
}
