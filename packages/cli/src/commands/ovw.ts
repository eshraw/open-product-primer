import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

type RiskLevel = 'Low' | 'Medium' | 'High' | null;

interface RiskProfile {
  value: RiskLevel;
  usability: RiskLevel;
  feasibility: RiskLevel;
  viability: RiskLevel;
}

interface BetMeta {
  doorType: '2-way' | '1-way' | null;
  risks: RiskProfile | null;
}

interface SequenceBet {
  id: string;
  title: string;
  blocked_by?: string[];
  unlocks?: string[];
}

interface SequenceBoard {
  now?: SequenceBet[];
  next?: SequenceBet[];
  later?: SequenceBet[];
  backlog?: SequenceBet[];
}

function resolveBetDecisionPath(betsDir: string, betId: string): string | null {
  if (!fs.existsSync(betsDir)) return null;
  const entries = fs.readdirSync(betsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith(betId)) {
      const candidate = path.join(betsDir, entry.name, 'bet-decision.md');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function extractDoorType(content: string): '2-way' | '1-way' | null {
  if (/\[x\]\s*2-way door/i.test(content)) return '2-way';
  if (/\[x\]\s*1-way door/i.test(content)) return '1-way';
  return null;
}

function extractRiskLevel(content: string, label: string): RiskLevel {
  const match = content.match(new RegExp(`\\*\\*${label}\\*\\*:\\s*(Low|Medium|High)`, 'i'));
  if (!match) return null;
  const raw = match[1];
  if (raw.toLowerCase() === 'low') return 'Low';
  if (raw.toLowerCase() === 'medium') return 'Medium';
  if (raw.toLowerCase() === 'high') return 'High';
  return null;
}

function extractRiskProfile(content: string): RiskProfile {
  return {
    value: extractRiskLevel(content, 'Value risk'),
    usability: extractRiskLevel(content, 'Usability risk'),
    feasibility: extractRiskLevel(content, 'Feasibility risk'),
    viability: extractRiskLevel(content, 'Business viability risk'),
  };
}

function loadBetMeta(betsDir: string, betId: string): BetMeta {
  const decisionPath = resolveBetDecisionPath(betsDir, betId);
  if (!decisionPath) return { doorType: null, risks: null };
  try {
    const content = fs.readFileSync(decisionPath, 'utf-8');
    return {
      doorType: extractDoorType(content),
      risks: extractRiskProfile(content),
    };
  } catch {
    return { doorType: null, risks: null };
  }
}

function abbreviate(level: RiskLevel): string {
  if (level === 'Low') return 'L';
  if (level === 'Medium') return 'M';
  if (level === 'High') return 'H';
  return '?';
}

function renderInlineMeta(meta: BetMeta): string {
  if (!meta.doorType && !meta.risks) return '[risk: unknown]';
  const door = meta.doorType ?? '?-way';
  if (!meta.risks) return `[${door} | risk: unknown]`;
  const { value, usability, feasibility, viability } = meta.risks;
  return `[${door} | value:${abbreviate(value)} usability:${abbreviate(usability)} feasibility:${abbreviate(feasibility)} viability:${abbreviate(viability)}]`;
}

function renderBlockers(bet: SequenceBet): string {
  if (!bet.blocked_by || bet.blocked_by.length === 0) return '';
  return ` [blocked by: ${bet.blocked_by.join(', ')}]`;
}

function renderLane(
  label: string,
  bets: SequenceBet[],
  betsDir: string,
  showMeta: boolean
): void {
  console.log(chalk.bold.cyan(`\n── ${label.toUpperCase()} ──`));
  if (bets.length === 0) {
    console.log('  (empty)');
    return;
  }
  for (const bet of bets) {
    if (showMeta) {
      const meta = loadBetMeta(betsDir, bet.id);
      const inline = renderInlineMeta(meta);
      const blockers = renderBlockers(bet);
      console.log(`  ${bet.id}  ${bet.title}  ${inline}${blockers}`);
    } else {
      const blockers = renderBlockers(bet);
      console.log(`  ${bet.id}  ${bet.title}${blockers}`);
    }
  }
}

function isElevated(level: RiskLevel): boolean {
  return level === 'Medium' || level === 'High';
}

function buildAdvisory(board: SequenceBoard, betsDir: string): string[] {
  const nudges: string[] = [];
  const now = board.now ?? [];
  const next = board.next ?? [];

  // Board-shape rules
  if (now.length === 0) {
    nudges.push('Now lane is empty — consider promoting a bet from next');
  }
  if (now.length > 3) {
    nudges.push(`Focus risk: now lane has ${now.length} active bets — consider narrowing`);
  }
  for (const bet of now) {
    const blockers = bet.blocked_by ?? [];
    const inFlightIds = new Set([...now.map((b) => b.id), ...next.map((b) => b.id)]);
    for (const blocker of blockers) {
      if (!inFlightIds.has(blocker)) {
        nudges.push(`${bet.id} may be stuck — its blocker ${blocker} is not in a flight lane`);
      }
    }
  }

  // Door-type sequencing rules
  const inFlightIds = new Set([...now.map((b) => b.id), ...next.map((b) => b.id)]);
  const metaCache = new Map<string, BetMeta>();
  const getMeta = (betId: string): BetMeta => {
    if (!metaCache.has(betId)) metaCache.set(betId, loadBetMeta(betsDir, betId));
    return metaCache.get(betId)!;
  };

  const nowMetas = now.map((b) => ({ bet: b, meta: getMeta(b.id) }));
  const nextMetas = next.map((b) => ({ bet: b, meta: getMeta(b.id) }));
  const inFlightMetas = [...nowMetas, ...nextMetas];

  // 2-way bets in flight that unlock 1-way bets (used to check unrisker presence)
  const twowayUnlocks = new Set<string>();
  for (const { bet, meta } of inFlightMetas) {
    if (meta.doorType === '2-way') {
      for (const unlockedId of bet.unlocks ?? []) twowayUnlocks.add(unlockedId);
    }
  }

  const allNow1Way = nowMetas.length > 0 && nowMetas.every(({ meta }) => meta.doorType === '1-way');
  if (allNow1Way) {
    nudges.push('Your now lane has no 2-way door bets — you are in full-commitment mode with no reversible fallback');
  }

  for (const { bet, meta } of nowMetas) {
    if (meta.doorType === '1-way' && !twowayUnlocks.has(bet.id)) {
      nudges.push(
        `${bet.id} is a 1-way door with no 2-way door unrisker in flight — consider sequencing a reversible spike first`
      );
    }
  }

  // 2-way door blocked by a 1-way door (inverted order)
  for (const { bet, meta } of inFlightMetas) {
    if (meta.doorType === '2-way') {
      for (const blockerId of bet.blocked_by ?? []) {
        const blockerMeta = getMeta(blockerId);
        if (blockerMeta.doorType === '1-way') {
          nudges.push(
            `${bet.id} (2-way) is blocked by ${blockerId} (1-way) — order may be inverted; 2-way doors should precede 1-way doors`
          );
        }
      }
    }
  }

  // Risk advisory rules for now lane
  for (const { bet, meta } of nowMetas) {
    if (!meta.risks) continue;
    const { value, usability, feasibility, viability } = meta.risks;
    if (isElevated(value) && meta.doorType === '1-way') {
      nudges.push(
        `${bet.id}: high commitment with unvalidated value — consider a 2-way door discovery bet first`
      );
    }
    if (isElevated(feasibility)) {
      nudges.push(
        `${bet.id}: feasibility risk is elevated — ensure a spike or prototype is in plan before full build`
      );
    }
    if (isElevated(usability)) {
      nudges.push(`${bet.id}: usability risk is elevated — plan for user testing before shipping`);
    }
    if (isElevated(viability)) {
      nudges.push(
        `${bet.id}: business viability risk is elevated — align with stakeholders before committing`
      );
    }
  }

  return nudges;
}

export function ovwCommand(): Command {
  return new Command('ovw')
    .description('Show the sequencing board with door type, risk profile, and advisory guidance')
    .action(() => {
      const projectRoot = process.cwd();
      const sequencePath = path.join(projectRoot, 'oprim', 'sequence.yaml');
      const betsDir = path.join(projectRoot, 'oprim', 'bets');

      if (!fs.existsSync(sequencePath)) {
        console.error("No oprim/sequence.yaml found — run 'oprim init' first");
        process.exit(1);
        return;
      }

      let board: SequenceBoard;
      try {
        board = (yaml.load(fs.readFileSync(sequencePath, 'utf-8')) as SequenceBoard) ?? {};
      } catch {
        console.error('Failed to parse oprim/sequence.yaml');
        process.exit(1);
        return;
      }

      const lanes: Array<{ key: keyof SequenceBoard; label: string; showMeta: boolean }> = [
        { key: 'now', label: 'now', showMeta: true },
        { key: 'next', label: 'next', showMeta: true },
        { key: 'later', label: 'later', showMeta: false },
        { key: 'backlog', label: 'backlog', showMeta: false },
      ];

      for (const { key, label, showMeta } of lanes) {
        renderLane(label, board[key] ?? [], betsDir, showMeta);
      }

      const nudges = buildAdvisory(board, betsDir);
      if (nudges.length > 0) {
        console.log(chalk.bold.yellow('\n── ADVISORY ──'));
        for (const nudge of nudges) {
          console.log(`  • ${nudge}`);
        }
      }
    });
}
