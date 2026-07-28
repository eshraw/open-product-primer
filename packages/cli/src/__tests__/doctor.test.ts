import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { doctorCommand } from '../commands/doctor';

let tmpDir: string;
let logLines: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-doctor-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  logLines = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('oprim doctor — archived bet exclusion', () => {
  it('does not emit a discovery check for bets under oprim/bets/archived/', async () => {
    const archivedBetDir = path.join(tmpDir, 'oprim', 'bets', 'archived', 'BET-002');
    fs.mkdirSync(archivedBetDir, { recursive: true });
    fs.writeFileSync(path.join(archivedBetDir, 'bet-decision.md'), '# BET-002\n');
    // No discovery.md — if doctor scanned archived bets, it would warn here

    await doctorCommand().parseAsync([], { from: 'user' });

    const allOutput = logLines.join('\n');
    expect(allOutput).not.toContain('BET-002');
  });

  it('still emits a discovery warning for active bets missing discovery.md', async () => {
    const activeBetDir = path.join(tmpDir, 'oprim', 'bets', 'pending', 'BET-005');
    fs.mkdirSync(activeBetDir, { recursive: true });
    fs.writeFileSync(path.join(activeBetDir, 'bet-decision.md'), '# BET-005\n');
    // No discovery.md — doctor should warn

    await doctorCommand().parseAsync([], { from: 'user' });

    const allOutput = logLines.join('\n');
    expect(allOutput).toContain('BET-005');
  });
});

// bet-026 — remote_context checks use the identity-only fetch (single file), never a full
// resolution, and separately flag git sources that have never been fully resolved.
describe('oprim doctor — remote context checks', () => {
  let cacheDir: string;

  beforeEach(() => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-doctor-remote-context-cache-'));
    process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'] = cacheDir;
    process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'] = '0';
  });

  afterEach(() => {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    delete process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'];
    delete process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'];
  });

  function writeConfig(sources: Array<Record<string, unknown>>): void {
    fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
    const yamlSources = sources
      .map((s) => `    - ${Object.entries(s).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n      ')}`)
      .join('\n');
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'config.yaml'),
      `version: 1\nremote_context:\n  enabled: true\n  sources:\n${yamlSources}\n`
    );
  }

  it('reports a healthy local-path source', async () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-doctor-sibling-'));
    fs.mkdirSync(path.join(repoDir, '.oprim-context'), { recursive: true });
    fs.writeFileSync(path.join(repoDir, '.oprim-context', 'context.yaml'), 'name: sibling\nversion: "1"\n');
    writeConfig([{ name: 'sibling', path: repoDir }]);

    await doctorCommand().parseAsync([], { from: 'user' });

    const output = logLines.join('\n');
    expect(output).toContain('remote_context: sibling (path)');
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('reports a missing local path distinctly, with a fix suggestion', async () => {
    writeConfig([{ name: 'ghost', path: path.join(tmpDir, 'does-not-exist') }]);

    await doctorCommand().parseAsync([], { from: 'user' });

    const output = logLines.join('\n');
    expect(output).toContain('remote_context: ghost (path)');
    expect(output).toContain('Path not found');
  });

  it('reports a missing identity file distinctly from an unreachable source', async () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-doctor-noidentity-'));
    writeConfig([{ name: 'no-identity', path: repoDir }]);

    await doctorCommand().parseAsync([], { from: 'user' });

    const output = logLines.join('\n');
    expect(output).toContain('Missing remote context identity');
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('flags a git source that has never been fully resolved, distinct from its health check', async () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-doctor-gitsrc-'));
    execFileSync('git', ['init', '--quiet', '-b', 'main'], { cwd: repoDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoDir });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoDir });
    fs.mkdirSync(path.join(repoDir, '.oprim-context'), { recursive: true });
    fs.writeFileSync(path.join(repoDir, '.oprim-context', 'context.yaml'), 'name: acme\nversion: "1"\n');
    execFileSync('git', ['add', '-A'], { cwd: repoDir });
    execFileSync('git', ['commit', '--quiet', '-m', 'initial'], { cwd: repoDir });

    writeConfig([{ name: 'acme', git: repoDir }]);

    await doctorCommand().parseAsync([], { from: 'user' });

    const output = logLines.join('\n');
    expect(output).toContain('remote_context: acme (git)');
    expect(output).toContain('never fully resolved');
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('does not emit any remote_context checks when none are configured', async () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });

    await doctorCommand().parseAsync([], { from: 'user' });

    expect(logLines.join('\n')).not.toContain('remote_context:');
  });
});
