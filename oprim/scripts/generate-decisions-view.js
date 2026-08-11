#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const DECISIONS_DIR = path.join(process.cwd(), 'oprim/decisions');
const OUTPUT_PATH = path.join(process.cwd(), 'oprim/decisions-view.md');

function parsePdrFile(text) {
  const idMatch = text.match(/^#\s*(PDR-\d+)[:\s]*(.*)$/m);
  const id = idMatch ? idMatch[1] : null;
  const title = idMatch ? idMatch[2].trim() : '';

  const statusMatch = text.match(/^##\s*Status\s*\n(.+)$/m) || text.match(/^Status:\s*(.+)$/m);
  const statusLine = statusMatch ? statusMatch[1].trim() : '';
  const supersededMatch = statusLine.match(/Superseded by (PDR-\d+)/);

  return {
    id,
    title,
    status: statusLine,
    supersededBy: supersededMatch ? supersededMatch[1] : null,
  };
}

function readPdrs() {
  if (!fs.existsSync(DECISIONS_DIR)) return [];
  const files = fs.readdirSync(DECISIONS_DIR).filter(f => /^PDR-\d+.*\.md$/.test(f));
  return files
    .map(f => ({ file: f, ...parsePdrFile(fs.readFileSync(path.join(DECISIONS_DIR, f), 'utf8')) }))
    .filter(pdr => pdr.id);
}

function generateBody(pdrs) {
  if (pdrs.length === 0) {
    return 'No decisions yet. Run `/oprim:pdr` to record your first product decision.\n';
  }

  const byId = Object.fromEntries(pdrs.map(p => [p.id, p]));
  const supersededOf = {};
  for (const pdr of pdrs) {
    if (pdr.supersededBy && byId[pdr.supersededBy]) {
      (supersededOf[pdr.supersededBy] = supersededOf[pdr.supersededBy] || []).push(pdr);
    }
  }

  const current = pdrs.filter(p => !p.supersededBy);
  if (current.length === 0) {
    return 'No current decisions — all recorded PDRs have been superseded.\n';
  }

  const lines = ['## Current decisions', ''];
  for (const pdr of current) {
    lines.push('- **' + pdr.id + '**: ' + pdr.title);
    for (const old of (supersededOf[pdr.id] || [])) {
      lines.push('  - supersedes [' + old.id + '](decisions/' + old.file + '): ' + old.title);
    }
  }

  return lines.join('\n') + '\n';
}

function main() {
  const pdrs = readPdrs();
  const header = [
    '<!-- Auto-generated from oprim/decisions/. Do not edit directly. -->',
    '<!-- Regenerate by running: node oprim/scripts/generate-decisions-view.js -->',
    '',
    '# Current Decisions',
    '',
    '',
  ].join('\n');
  fs.writeFileSync(OUTPUT_PATH, header + generateBody(pdrs));
  console.log('Written: oprim/decisions-view.md');
}

main();
