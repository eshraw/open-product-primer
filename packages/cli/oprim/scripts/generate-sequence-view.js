#!/usr/bin/env node
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

  for (const raw of text.split('\n')) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;

    if (indent === 0) {
      const m = trimmed.match(/^(\w+):/);
      if (m) { section = BUCKETS.includes(m[1]) ? m[1] : null; item = null; listField = null; }
      continue;
    }

    if (!section) continue;

    if (indent === 2 && trimmed.startsWith('- ')) {
      item = {}; result[section].push(item); listField = null;
      const rest = trimmed.slice(2);
      const m = rest.match(/^(\w+):\s*(.*)/);
      if (m) item[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
      continue;
    }

    if (indent === 4 && item) {
      const m = trimmed.match(/^(\w+):\s*(.*)/);
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
  const lines = ['```mermaid', 'graph TD'];
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

  lines.push('```');
  return lines.join('\n');
}

function generateBacklogSection(seq) {
  const backlog = seq.backlog || [];
  if (!backlog.length) return '';
  return '\n\n### Backlog\n' + backlog.map(b => '- **' + b.id + '**: ' + b.title).join('\n');
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
  ].join('\n');
  fs.writeFileSync(OUTPUT_PATH, header + generateMermaidBlock(seq) + generateBacklogSection(seq) + '\n');
  console.log('Written: oprim/sequence-view.md');
}

main();
