import * as path from 'path';
import * as fs from 'fs';
import { type Check } from './integrity';
import { parseRequirementHeaders, parseCurrentTruthHeaders, findCrossBetConflicts } from './spec-delta';

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, ' ').toLowerCase();
}

function extractBetId(dirName: string): string {
  const match = dirName.match(/^(BET-\d+)/);
  return match ? match[1]! : dirName;
}

function activeBetDirs(betsDir: string): fs.Dirent[] {
  if (!fs.existsSync(betsDir)) return [];
  return fs
    .readdirSync(betsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'archived');
}

function isPromoted(betDecisionContent: string): boolean {
  const linksMatch = betDecisionContent.match(/## Links\n([\s\S]*?)(?=\n## |$)/);
  const linksSection = linksMatch ? linksMatch[1]! : betDecisionContent;
  const lineMatch = linksSection.match(/^- *OpenSpec change:\s*(.*)$/m);
  if (!lineMatch) return false;

  const value = lineMatch[1]!.trim().replace(/^<|>$/g, '').trim();
  if (value === '') return false;
  if (/to be filled when promoted/i.test(value)) return false;
  if (/^path once promoted$/i.test(value)) return false;
  return true;
}

/**
 * Flags a promoted bet (one whose bet-decision.md links a non-placeholder OpenSpec
 * change) that has no criteria.yaml alongside it. Un-promoted bets are not checked.
 */
export function checkBetDefinitionOfDone(projectRoot: string, checks: Check[]): void {
  const betsDir = path.join(projectRoot, 'oprim', 'bets');

  for (const entry of activeBetDirs(betsDir)) {
    const betDir = path.join(betsDir, entry.name);
    const decisionPath = path.join(betDir, 'bet-decision.md');
    if (!fs.existsSync(decisionPath)) continue;

    const content = fs.readFileSync(decisionPath, 'utf-8');
    if (!isPromoted(content)) continue;

    const hasCriteria = fs.existsSync(path.join(betDir, 'criteria.yaml'));
    if (!hasCriteria) {
      const betId = extractBetId(entry.name);
      checks.push({
        name: `bet: ${betId} promoted without criteria.yaml`,
        pass: false,
        note: `Add criteria.yaml to oprim/bets/${entry.name}/, or run the oprim-criteria skill`,
        required: false,
      });
    }
  }
}

/**
 * Flags a MODIFIED/REMOVED requirement in an active bet's spec delta whose header no
 * longer text-matches (whitespace-insensitive) current truth.
 */
export function checkSpecDeltaDrift(projectRoot: string, checks: Check[]): void {
  const betsDir = path.join(projectRoot, 'oprim', 'bets');

  for (const entry of activeBetDirs(betsDir)) {
    const betId = extractBetId(entry.name);
    const specsDir = path.join(betsDir, entry.name, 'specs');
    if (!fs.existsSync(specsDir)) continue;

    const capEntries = fs.readdirSync(specsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const capEntry of capEntries) {
      const deltaPath = path.join(specsDir, capEntry.name, 'spec.md');
      if (!fs.existsSync(deltaPath)) continue;
      const deltaContent = fs.readFileSync(deltaPath, 'utf-8');

      const currentTruthPath = path.join(projectRoot, 'oprim', 'specs', capEntry.name, 'spec.md');
      const currentHeaders = fs.existsSync(currentTruthPath)
        ? parseCurrentTruthHeaders(fs.readFileSync(currentTruthPath, 'utf-8'))
        : [];

      for (const section of ['MODIFIED', 'REMOVED'] as const) {
        for (const header of parseRequirementHeaders(deltaContent, section)) {
          const matches = currentHeaders.some((h) => normalizeHeader(h) === normalizeHeader(header));
          if (!matches) {
            checks.push({
              name: `spec-delta: ${betId}'s ${section} requirement "${header}" in ${capEntry.name} no longer matches current truth`,
              pass: false,
              note: `No matching requirement header found in oprim/specs/${capEntry.name}/spec.md`,
              required: true,
            });
          }
        }
      }
    }
  }
}

/** Surfaces overlapping requirement headers across active bets' spec deltas. */
export function checkCrossBetConflicts(projectRoot: string, checks: Check[]): void {
  const betsDir = path.join(projectRoot, 'oprim', 'bets');
  for (const conflict of findCrossBetConflicts(betsDir)) {
    checks.push({
      name: `spec-delta: ${extractBetId(conflict.betA)} and ${extractBetId(conflict.betB)} both touch "${conflict.header}" in ${conflict.capability}`,
      pass: false,
      note: 'Overlapping requirement header between active bets — archiving one first applies last-write-wins to the other (no 3-way merge)',
      required: true,
    });
  }
}
