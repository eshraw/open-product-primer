#!/usr/bin/env node
// tsc only compiles .ts files — the bundled *.schema.yaml / *.template.md workflow definitions
// (and their non-overridable variant files) are plain assets that must be copied into dist/
// alongside the compiled workflow-schema.js / workflow-renderer.js that read them at runtime.
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'workflows');
const distDir = path.join(__dirname, '..', 'dist', 'workflows');

fs.mkdirSync(distDir, { recursive: true });

for (const filename of fs.readdirSync(srcDir)) {
  if (filename.endsWith('.yaml') || filename.endsWith('.md')) {
    fs.copyFileSync(path.join(srcDir, filename), path.join(distDir, filename));
  }
}
