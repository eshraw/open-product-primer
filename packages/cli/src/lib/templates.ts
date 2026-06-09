export function configTemplate(projectName: string, openspecEnabled: boolean, graphifyEnabled: boolean): string {
  return `version: 1
project:
  name: "${projectName}"
agents: []
integrations:
  openspec:
    enabled: ${openspecEnabled}
    changes_dir: openspec/changes
  graphify:
    enabled: ${graphifyEnabled}
    graph_dir: graphify-out
measurement:
  amplitude:
    enabled: false
  bigquery:
    enabled: false
    metabase_url: null
sequencing:
  wip_limits:
    now: 2
`;
}

export const sequenceTemplate = `wip_limits:
  now: 2

now: []
next: []
later: []
backlog: []
`;

export const pdrTemplate = `# PDR-XXX: <Decision title>

## Status
Proposed | Accepted | Deprecated | Superseded by PDR-YYY

## Context
<What forced this decision?>

## Decision
<Clear statement of what is decided>

## Alternatives considered
- <Alternative A and why rejected>
- <Alternative B and why rejected>

## Consequences
- Positive: <...>
- Trade-offs: <...>
- Follow-ups: <...>

## Evidence
- <Research link>
- <Data link>

## Related
- Bets: <BET-IDs>
- OpenSpec: <change paths>
- Supersedes: <PDR-ID or none>
`;

export const betDecisionTemplate = `# Decision: BET-XXX <Bet title>
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now | Defer | Kill
- Date: YYYY-MM-DD
- Owner: <name>
- Review date: YYYY-MM-DD

## Why now
- <prioritization rationale>

## Alternatives considered
- <alternative + reason>

## Expected outcomes
- <metric: baseline -> target in timeframe>

## Kill criteria / rollback trigger
- <condition and action>

## Links
- PDRs: <PDR-IDs>
- OpenSpec change: <path once promoted>
`;

export const criteriaTemplate = `metrics:
  - id: metric_id
    name: "Metric name"
    baseline: 0.00
    target: 0.00
    timeframe: "30 days post-launch"
    launch_date: "YYYY-MM-DD"
    source:
      type: amplitude
      definition:
        event: event_name
        aggregation: unique_users
        denominator_event: null
    segment: null
`;

export const discoveryTemplate = `# Discovery: BET-XXX <Bet title>

## Problem Framing
- **Problem statement**: <What problem are we solving and for whom?>
- **Evidence this is real**: <Data, support tickets, user quotes, etc.>
- **Why it matters**: <Business or user impact if left unsolved>

## User Research Signals
- **Research conducted**: <Interviews, surveys, usability tests, etc.>
- **Key findings**: <What did we learn?>
- **Assumptions to validate**: <What are we still unsure about?>

## Competitive Context
- **How others solve this**: <Competitor or adjacent solutions>
- **Our differentiation**: <Why our approach is better or different>
- **Gaps / opportunities**: <What's underserved in the market?>

## Open Questions
- [ ] <Question 1 — what needs to be answered before committing?>
- [ ] <Question 2>
- [ ] <Question 3>
`;

export const sequenceViewScriptTemplate = `#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SEQUENCE_PATH = path.join(process.cwd(), 'oprim/sequence.yaml');
const OUTPUT_PATH = path.join(process.cwd(), 'oprim/sequence-view.md');
const MAX_LABEL_LEN = 40;

function parseSequenceYaml(text) {
  const BUCKETS = ['now', 'next', 'later', 'backlog'];
  const result = Object.fromEntries(BUCKETS.map(b => [b, []]));
  let section = null, item = null, listField = null;

  for (const raw of text.split('\\n')) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;

    if (indent === 0) {
      const m = trimmed.match(/^(\\w+):/);
      if (m) { section = BUCKETS.includes(m[1]) ? m[1] : null; item = null; listField = null; }
      continue;
    }

    if (!section) continue;

    if (indent === 2 && trimmed.startsWith('- ')) {
      item = {}; result[section].push(item); listField = null;
      const rest = trimmed.slice(2);
      const m = rest.match(/^(\\w+):\\s*(.*)/);
      if (m) item[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
      continue;
    }

    if (indent === 4 && item) {
      const m = trimmed.match(/^(\\w+):\\s*(.*)/);
      if (!m) continue;
      const [, key, val] = m;
      const v = val.trim();
      if (v === '[]') { item[key] = []; listField = null; }
      else if (v === '') { item[key] = []; listField = key; }
      else { item[key] = v.replace(/^['"]|['"]$/g, ''); listField = null; }
      continue;
    }

    if (indent === 6 && item && listField && trimmed.startsWith('- ')) {
      item[listField].push(trimmed.slice(2).trim());
    }
  }
  return result;
}

function nodeId(betId) { return betId.replace(/-/g, ''); }

function truncate(title) {
  return title.length > MAX_LABEL_LEN ? title.slice(0, MAX_LABEL_LEN - 3) + '...' : title;
}

function generateMermaidBlock(seq) {
  const lines = ['\`\`\`mermaid', 'graph TD'];
  const ACTIVE = [['now', 'Now'], ['next', 'Next'], ['later', 'Later']];

  for (const [key, label] of ACTIVE) {
    const bets = seq[key] || [];
    if (!bets.length) continue;
    lines.push('    subgraph ' + label);
    for (const bet of bets) {
      lines.push('        ' + nodeId(bet.id) + '["' + bet.id + ': ' + truncate(bet.title) + '"]');
    }
    lines.push('    end');
  }

  for (const [key] of ACTIVE) {
    for (const bet of (seq[key] || [])) {
      for (const blocker of (bet.blocked_by || [])) {
        lines.push('    ' + nodeId(bet.id) + ' --> ' + nodeId(blocker));
      }
    }
  }

  lines.push('\`\`\`');
  return lines.join('\\n');
}

function generateBacklogSection(seq) {
  const backlog = seq.backlog || [];
  if (!backlog.length) return '';
  return '\\n\\n### Backlog\\n' + backlog.map(b => '- **' + b.id + '**: ' + b.title).join('\\n');
}

function main() {
  const seq = parseSequenceYaml(fs.readFileSync(SEQUENCE_PATH, 'utf8'));
  const header = [
    '<!-- Auto-generated from oprim/sequence.yaml. Do not edit directly. -->',
    '<!-- Regenerate by running: node oprim/scripts/generate-sequence-view.js -->',
    '',
    '# Sequencing Board',
    '',
    '',
  ].join('\\n');
  fs.writeFileSync(OUTPUT_PATH, header + generateMermaidBlock(seq) + generateBacklogSection(seq) + '\\n');
  console.log('Written: oprim/sequence-view.md');
}

main();
`;

export const kpiReviewTemplate = `# KPI Review: BET-XXX

**Review date:** YYYY-MM-DD
**Reviewed by:** <name>

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| <metric name> | - | - | - | pending |

## Decision quality
<Did outcomes validate the decision? What would you do differently?>

## Actions
- [ ] Update bet-decision outcome section
- [ ] Update affected PDRs
- [ ] Re-sequence impacted bets
`;
