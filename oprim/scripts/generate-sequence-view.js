#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const yaml = require(path.join(__dirname, '../../packages/cli/node_modules/js-yaml'));

const REPO_ROOT = path.join(__dirname, '../..');
const SEQUENCE_PATH = path.join(REPO_ROOT, 'oprim/sequence.yaml');
const OUTPUT_PATH = path.join(REPO_ROOT, 'oprim/sequence-view.md');

const MAX_LABEL_LEN = 40;

function nodeId(betId) {
  return betId.replace(/-/g, '');
}

function truncate(title) {
  return title.length > MAX_LABEL_LEN
    ? title.slice(0, MAX_LABEL_LEN - 3) + '...'
    : title;
}

function generateMermaidBlock(sequence) {
  const lines = ['```mermaid', 'graph TD'];

  const ACTIVE_BUCKETS = [['now', 'Now'], ['next', 'Next'], ['later', 'Later']];

  for (const [key, label] of ACTIVE_BUCKETS) {
    const bets = sequence[key] || [];
    if (bets.length === 0) continue;
    lines.push(`    subgraph ${label}`);
    for (const bet of bets) {
      lines.push(`        ${nodeId(bet.id)}["${bet.id}: ${truncate(bet.title)}"]`);
    }
    lines.push('    end');
  }

  // blocked_by edges: dependent → blocker
  for (const [key] of ACTIVE_BUCKETS) {
    for (const bet of (sequence[key] || [])) {
      for (const blocker of (bet.blocked_by || [])) {
        lines.push(`    ${nodeId(bet.id)} --> ${nodeId(blocker)}`);
      }
    }
  }

  lines.push('```');
  return lines.join('\n');
}

function generateBacklogSection(sequence) {
  const backlog = sequence.backlog || [];
  if (backlog.length === 0) return '';
  return [
    '',
    '',
    '### Backlog',
    ...backlog.map(bet => `- **${bet.id}**: ${bet.title}`),
  ].join('\n');
}

function main() {
  const sequence = yaml.load(fs.readFileSync(SEQUENCE_PATH, 'utf8'));

  const header = [
    '<!-- Auto-generated from oprim/sequence.yaml. Do not edit directly. -->',
    '<!-- Regenerate by running /oprim:sequence. -->',
    '',
    '# Sequencing Board',
    '',
    '',
  ].join('\n');

  const body = generateMermaidBlock(sequence) + generateBacklogSection(sequence) + '\n';

  fs.writeFileSync(OUTPUT_PATH, header + body);
  console.log('Written: oprim/sequence-view.md');
}

main();
