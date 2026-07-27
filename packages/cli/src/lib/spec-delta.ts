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

export interface CrossBetConflict {
  betA: string;
  betB: string;
  capability: string;
  header: string;
}

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, ' ').toLowerCase();
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

  const betCapHeaders = new Map<string, Map<string, string[]>>();

  for (const betName of betNames) {
    const specsDir = path.join(betsDir, betName, 'specs');
    if (!fs.existsSync(specsDir)) continue;

    const capMap = new Map<string, string[]>();
    const capEntries = fs.readdirSync(specsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const capEntry of capEntries) {
      const specPath = path.join(specsDir, capEntry.name, 'spec.md');
      if (!fs.existsSync(specPath)) continue;
      const content = fs.readFileSync(specPath, 'utf-8');
      const headers = [
        ...parseRequirementHeaders(content, 'ADDED'),
        ...parseRequirementHeaders(content, 'MODIFIED'),
        ...parseRequirementHeaders(content, 'REMOVED'),
      ];
      capMap.set(capEntry.name, headers);
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
        for (const headerA of headersA) {
          const match = headersB.find((h) => normalizeHeader(h) === normalizeHeader(headerA));
          if (match) {
            conflicts.push({ betA: names[i]!, betB: names[j]!, capability, header: headerA });
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
