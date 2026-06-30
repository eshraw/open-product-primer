import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { CLAUDE_SKILLS, OPRIM_CONTEXT_SKILL_STEP } from './install-agent';

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
      for (const ref of entry.blocked_by ?? []) {
        if (!allIds.has(ref)) {
          checks.push({
            name: `sequence: dangling blocked_by reference ${ref}`,
            pass: false,
            note: `${entry.id} references ${ref} which is not in the sequence`,
            required: false,
          });
        }
      }
      for (const ref of entry.unlocks ?? []) {
        if (!allIds.has(ref)) {
          checks.push({
            name: `sequence: dangling unlocks reference ${ref}`,
            pass: false,
            note: `${entry.id} references ${ref} which is not in the sequence`,
            required: false,
          });
        }
      }
    }
  }
}

export function checkSkillVersionDrift(projectRoot: string, checks: Check[]): void {
  const skillsDir = path.join(projectRoot, '.claude', 'skills');
  if (!fs.existsSync(skillsDir)) return;

  for (const [name, bundledContent] of Object.entries(CLAUDE_SKILLS)) {
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
