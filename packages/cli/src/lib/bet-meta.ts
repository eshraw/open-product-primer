// BET-079 — bet-decision.md parsing shared by `oprim ovw` (single board) and the portfolio view.
// Pure string parsing plus one directory lookup; no behaviour of its own.
import * as fs from 'fs';
import * as path from 'path';

export type RiskLevel = 'Low' | 'Medium' | 'High' | null;

export interface RiskProfile {
  value: RiskLevel;
  usability: RiskLevel;
  feasibility: RiskLevel;
  viability: RiskLevel;
}

export interface BetMeta {
  doorType: '2-way' | '1-way' | null;
  risks: RiskProfile | null;
}

/** `oprim/bets/pending/<BET-NNN-slug>/bet-decision.md` for `betId`, or null. `BET-01` never matches `BET-012`. */
export function resolveBetDecisionPath(betsDir: string, betId: string): string | null {
  if (!fs.existsSync(betsDir)) return null;
  const entries = fs.readdirSync(betsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && (entry.name === betId || entry.name.startsWith(`${betId}-`))) {
      const candidate = path.join(betsDir, entry.name, 'bet-decision.md');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

export function extractDoorType(content: string): '2-way' | '1-way' | null {
  if (/\[x\]\s*2-way door/i.test(content)) return '2-way';
  if (/\[x\]\s*1-way door/i.test(content)) return '1-way';
  return null;
}

function extractRiskLevel(content: string, label: string): RiskLevel {
  const match = content.match(new RegExp(`\\*\\*${label}\\*\\*:\\s*(Low|Medium|High)`, 'i'));
  if (!match) return null;
  const raw = match[1].toLowerCase();
  if (raw === 'low') return 'Low';
  if (raw === 'medium') return 'Medium';
  if (raw === 'high') return 'High';
  return null;
}

export function extractRiskProfile(content: string): RiskProfile {
  return {
    value: extractRiskLevel(content, 'Value risk'),
    usability: extractRiskLevel(content, 'Usability risk'),
    feasibility: extractRiskLevel(content, 'Feasibility risk'),
    viability: extractRiskLevel(content, 'Business viability risk'),
  };
}

export function loadBetMeta(betsDir: string, betId: string): BetMeta {
  const decisionPath = resolveBetDecisionPath(betsDir, betId);
  if (!decisionPath) return { doorType: null, risks: null };
  try {
    const content = fs.readFileSync(decisionPath, 'utf-8');
    return { doorType: extractDoorType(content), risks: extractRiskProfile(content) };
  } catch {
    return { doorType: null, risks: null };
  }
}

/** `- Review date: YYYY-MM-DD` (the bet-decision template's line), or null when absent or a placeholder. */
export function extractReviewDate(content: string): string | null {
  const m = content.match(/^\s*[-*]?\s*\**Review date:?\**:?\s*(\d{4}-\d{2}-\d{2})\b/im);
  return m ? m[1] : null;
}

/**
 * The `## Links` section as `label → comma-separated tokens` (labels lower-cased, tokens stripped
 * of backticks/brackets). Prose such as "None" stays a token; callers filter with `parseRef`.
 */
export function extractLinks(content: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let inLinks = false;
  for (const line of content.split('\n')) {
    if (/^##\s/.test(line)) {
      inLinks = /^##\s+Links\s*$/.test(line);
      continue;
    }
    if (!inLinks) continue;
    const m = line.match(/^\s*[-*]\s*([^:]+?)\s*:\s*(.*)$/);
    if (!m) continue;
    const tokens = m[2]
      .split(',')
      .map((t) => t.replace(/[`[\]]/g, '').trim())
      .filter((t) => t !== '');
    const key = m[1].toLowerCase();
    out.set(key, [...(out.get(key) ?? []), ...tokens]);
  }
  return out;
}
