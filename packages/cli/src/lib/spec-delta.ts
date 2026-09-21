import * as path from 'path';
import * as fs from 'fs';

export type DeltaSection = 'ADDED' | 'MODIFIED' | 'REMOVED';

interface RequirementBlock {
  header: string;
  content: string;
}

export interface FoldResult {
  content: string;
  notes: string[];
}

export type ConflictCriticality = 'low' | 'medium' | 'high';

export interface CrossBetConflict {
  betA: string;
  betB: string;
  capability: string;
  header: string;
  criticality: ConflictCriticality;
}

interface HeaderInfo {
  header: string;
  section: DeltaSection;
  content: string;
}

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Word-overlap ratio (0–1) between two requirement bodies, used to gauge how much two edits diverge. */
function contentSimilarity(a: string, b: string): number {
  const tokenize = (s: string): Set<string> => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 1 : intersection / union;
}

/**
 * Estimates how urgently two bets touching the same requirement header need to coordinate:
 * one side removing what the other adds/modifies is a direct contradiction (high); both sides
 * removing the same requirement is agreement, not conflict (low); otherwise it comes down to how
 * much the two requirement bodies actually diverge.
 */
function estimateCriticality(a: HeaderInfo, b: HeaderInfo): ConflictCriticality {
  const sections = [a.section, b.section];
  if (sections.includes('REMOVED') && sections.includes('ADDED')) return 'high';
  if (sections.includes('REMOVED') && sections.includes('MODIFIED')) return 'high';
  if (a.section === 'REMOVED' && b.section === 'REMOVED') return 'low';

  const similarity = contentSimilarity(a.content, b.content);
  if (similarity >= 0.8) return 'low';
  if (similarity >= 0.5) return 'medium';
  return 'high';
}

function extractSection(markdown: string, sectionTitle: string): string | null {
  const lines = markdown.split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === `## ${sectionTitle}`);
  if (startIdx === -1) return null;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]!)) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx + 1, endIdx).join('\n');
}

function parseRequirementBlocks(sectionContent: string): RequirementBlock[] {
  const lines = sectionContent.split('\n');
  const blocks: RequirementBlock[] = [];
  let current: { header: string; lines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^### Requirement:\s*(.*)$/);
    if (match) {
      if (current) {
        blocks.push({ header: current.header, content: current.lines.join('\n').trim() });
      }
      current = { header: match[1]!.trim(), lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) {
    blocks.push({ header: current.header, content: current.lines.join('\n').trim() });
  }
  return blocks;
}

/** Extracts `### Requirement:` header text from a `## ADDED/MODIFIED/REMOVED Requirements` section of a delta file. */
export function parseRequirementHeaders(deltaContent: string, section: DeltaSection): string[] {
  const sectionContent = extractSection(deltaContent, `${section} Requirements`);
  if (sectionContent === null) return [];
  return parseRequirementBlocks(sectionContent).map((b) => b.header);
}

/** Extracts `### Requirement:` header text from current truth's flat `## Requirements` section. */
export function parseCurrentTruthHeaders(currentTruthContent: string): string[] {
  const sectionContent = extractSection(currentTruthContent, 'Requirements');
  if (sectionContent === null) return [];
  return parseRequirementBlocks(sectionContent).map((b) => b.header);
}

/**
 * Folds a bet's spec delta into current truth, mirroring the ADDED-append /
 * MODIFIED-replace-or-note / REMOVED-delete-or-note algorithm `/oprim:archive` uses.
 * Throws if `currentTruth` is null and the delta contains MODIFIED/REMOVED requirements
 * (nothing to modify/remove against yet).
 */
export function foldDelta(currentTruth: string | null, delta: string): FoldResult {
  const notes: string[] = [];

  const addedSection = extractSection(delta, 'ADDED Requirements');
  const modifiedSection = extractSection(delta, 'MODIFIED Requirements');
  const removedSection = extractSection(delta, 'REMOVED Requirements');

  const added = addedSection !== null ? parseRequirementBlocks(addedSection) : [];
  const modified = modifiedSection !== null ? parseRequirementBlocks(modifiedSection) : [];
  const removed = removedSection !== null ? parseRequirementBlocks(removedSection) : [];

  if (currentTruth === null) {
    if (modified.length > 0 || removed.length > 0) {
      throw new Error(
        'cannot modify/remove a requirement — no current-truth spec exists yet for this capability.'
      );
    }
    const body = added.map((b) => b.content).join('\n\n');
    return { content: `## Requirements\n\n${body}\n`, notes };
  }

  const reqSection = extractSection(currentTruth, 'Requirements') ?? '';
  const blocks = parseRequirementBlocks(reqSection);

  for (const block of modified) {
    const idx = blocks.findIndex((b) => normalizeHeader(b.header) === normalizeHeader(block.header));
    if (idx === -1) {
      blocks.push(block);
      notes.push(`MODIFIED requirement "${block.header}" had no match in current truth — treated as ADDED`);
    } else {
      blocks[idx] = block;
    }
  }

  for (const block of removed) {
    const idx = blocks.findIndex((b) => normalizeHeader(b.header) === normalizeHeader(block.header));
    if (idx === -1) {
      notes.push(`REMOVED requirement "${block.header}" had no match in current truth — nothing removed`);
    } else {
      blocks.splice(idx, 1);
    }
  }

  for (const block of added) {
    blocks.push(block);
  }

  const body = blocks.map((b) => b.content).join('\n\n');
  return { content: `## Requirements\n\n${body}\n`, notes };
}

/**
 * Scans all active bet directories (excluding archived/) pairwise for overlapping
 * `### Requirement:` headers within the same capability's spec delta.
 */
export function findCrossBetConflicts(betsDir: string): CrossBetConflict[] {
  if (!fs.existsSync(betsDir)) return [];

  const betNames = fs
    .readdirSync(betsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'archived')
    .map((e) => e.name);

  const betCapHeaders = new Map<string, Map<string, HeaderInfo[]>>();

  for (const betName of betNames) {
    const specsDir = path.join(betsDir, betName, 'specs');
    if (!fs.existsSync(specsDir)) continue;

    const capMap = new Map<string, HeaderInfo[]>();
    const capEntries = fs.readdirSync(specsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const capEntry of capEntries) {
      const specPath = path.join(specsDir, capEntry.name, 'spec.md');
      if (!fs.existsSync(specPath)) continue;
      const content = fs.readFileSync(specPath, 'utf-8');
      const infos: HeaderInfo[] = [];
      for (const section of ['ADDED', 'MODIFIED', 'REMOVED'] as const) {
        const sectionContent = extractSection(content, `${section} Requirements`);
        if (sectionContent === null) continue;
        for (const block of parseRequirementBlocks(sectionContent)) {
          infos.push({ header: block.header, section, content: block.content });
        }
      }
      capMap.set(capEntry.name, infos);
    }
    betCapHeaders.set(betName, capMap);
  }

  const conflicts: CrossBetConflict[] = [];
  const names = [...betCapHeaders.keys()];

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const capMapA = betCapHeaders.get(names[i]!)!;
      const capMapB = betCapHeaders.get(names[j]!)!;
      for (const [capability, headersA] of capMapA) {
        const headersB = capMapB.get(capability);
        if (!headersB) continue;
        for (const infoA of headersA) {
          const infoB = headersB.find((h) => normalizeHeader(h.header) === normalizeHeader(infoA.header));
          if (infoB) {
            conflicts.push({
              betA: names[i]!,
              betB: names[j]!,
              capability,
              header: infoA.header,
              criticality: estimateCriticality(infoA, infoB),
            });
          }
        }
      }
    }
  }

  return conflicts;
}

export function normalizeBetId(input: string): string {
  const digits = input.replace(/[^0-9]/g, '');
  return `BET-${digits.padStart(3, '0')}`;
}

/** Resolves a bet ID (accepting `bet-005`, `005`, `5`, or `BET-005`) to its directory name under `betsDir`. */
export function resolveBetDirectory(betsDir: string, betIdInput: string): string | null {
  if (!fs.existsSync(betsDir)) return null;
  const betId = normalizeBetId(betIdInput);

  const entries = fs
    .readdirSync(betsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'archived');

  const exact = entries.find((e) => e.name === betId);
  if (exact) return exact.name;

  const slugMatches = entries.filter((e) => e.name.startsWith(`${betId}-`));
  if (slugMatches.length === 1) return slugMatches[0]!.name;

  return null;
}
