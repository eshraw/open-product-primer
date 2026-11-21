import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { CLAUDE_SKILLS, OPRIM_CONTEXT_SKILL_STEP, specAuthoringSkill } from './install-agent';
import { isQualifiedRef } from './portfolio/refs';

export interface Check {
  name: string;
  pass: boolean;
  note?: string;
  required: boolean;
}

interface SequenceEntry {
  id: string;
  blocked_by?: string[];
  unlocks?: string[];
}

interface SequenceDoc {
  wip_limits?: { now?: number };
  now?: SequenceEntry[];
  next?: SequenceEntry[];
  later?: SequenceEntry[];
  backlog?: SequenceEntry[];
}

export function checkSequenceIntegrity(projectRoot: string, checks: Check[]): void {
  const sequencePath = path.join(projectRoot, 'oprim', 'sequence.yaml');
  if (!fs.existsSync(sequencePath)) return;

  let seq: SequenceDoc;
  try {
    seq = yaml.load(fs.readFileSync(sequencePath, 'utf-8')) as SequenceDoc;
  } catch {
    checks.push({
      name: 'sequence: could not parse sequence.yaml',
      pass: false,
      note: 'Fix YAML syntax errors in oprim/sequence.yaml',
      required: false,
    });
    return;
  }

  const lanes: SequenceEntry[][] = [seq.now, seq.next, seq.later, seq.backlog].filter(
    (l): l is SequenceEntry[] => Array.isArray(l)
  );

  const allIds = new Set<string>(lanes.flat().map((e) => e.id));

  const wipLimit = seq.wip_limits?.now;
  const nowCount = seq.now?.length ?? 0;
  if (wipLimit !== undefined && nowCount > wipLimit) {
    checks.push({
      name: `sequence: WIP limit exceeded (${nowCount} active, limit ${wipLimit})`,
      pass: false,
      note: 'Move items out of now: to respect wip_limits.now',
      required: false,
    });
  }

  for (const lane of lanes) {
    for (const entry of lane) {
      for (const field of ['blocked_by', 'unlocks'] as const) {
        const values = entry[field];
        if (!Array.isArray(values)) continue;
        for (const ref of values as unknown[]) {
          // BET-076: `checkout: BET-012` (with a space) is a YAML map, not a reference.
          if (ref !== null && typeof ref === 'object' && !Array.isArray(ref)) {
            const suggestion = Object.entries(ref as Record<string, unknown>)
              .map(([k, v]) => `${k}:${String(v)}`)
              .join(', ');
            checks.push({
              name: `sequence: ${entry.id} ${field} entry parsed as a map — write it as ${suggestion}`,
              pass: false,
              note: 'Remove the space after the colon so YAML reads it as a <source>:<ID> reference',
              required: false,
            });
            continue;
          }
          // Qualified <source>:<ID> references are resolved by checkCrossProductRefs instead.
          if (isQualifiedRef(ref)) continue;
          if (!allIds.has(ref as string)) {
            checks.push({
              name: `sequence: dangling ${field} reference ${String(ref)}`,
              pass: false,
              note: `${entry.id} references ${String(ref)} which is not in the sequence`,
              required: false,
            });
          }
        }
      }
    }
  }
}

export function checkSkillVersionDrift(projectRoot: string, checks: Check[]): void {
  const skillsDir = path.join(projectRoot, '.claude', 'skills');
  if (!fs.existsSync(skillsDir)) return;

  const bundledSkills: Record<string, string> = { ...CLAUDE_SKILLS, 'oprim-spec': specAuthoringSkill() };

  for (const [name, bundledContent] of Object.entries(bundledSkills)) {
    const skillPath = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    const installed = fs.readFileSync(skillPath, 'utf-8');
    const stripped = installed.replace('\n\n' + OPRIM_CONTEXT_SKILL_STEP + '\n\n', '\n\n');
    if (stripped !== bundledContent) {
      checks.push({
        name: `agent: Claude skill ${name} is out of date`,
        pass: false,
        note: "Run 'oprim update' to refresh",
        required: false,
      });
    }
  }
}
