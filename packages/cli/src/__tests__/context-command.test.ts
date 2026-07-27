import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { contextCommand } from '../commands/context';
import { readRemoteContextConfig, readIdentity } from '../lib/remote-context';

let tmpDir: string;
let cacheDir: string;
let logLines: string[];
let errorLines: string[];
let exitCode: number | undefined;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-context-cmd-test-'));
  cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-context-cmd-cache-'));
  fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
  process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'] = cacheDir;
  process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'] = '0';

  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  logLines = [];
  errorLines = [];
  exitCode = undefined;
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errorLines.push(args.map(String).join(' '));
  });
  vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    exitCode = code;
    throw new Error(`process.exit(${code})`);
  }) as never);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(cacheDir, { recursive: true, force: true });
  delete process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'];
  delete process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'];
  vi.restoreAllMocks();
});

function makeSiblingRepo(opts: { name: string; description?: string }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-context-sibling-'));
  fs.mkdirSync(path.join(dir, '.oprim-context'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.oprim-context', 'context.yaml'),
    `name: ${opts.name}\nversion: "1"\n${opts.description ? `description: "${opts.description}"\n` : ''}`
  );
  fs.mkdirSync(path.join(dir, 'oprim', 'decisions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'oprim', 'decisions', 'PDR-001.md'), '# PDR-001\n');
  return dir;
}

describe('oprim context init', () => {
  it('writes an identity file with a description', async () => {
    await contextCommand().parseAsync(['init', '--description', 'covers auth and billing'], { from: 'user' });

    const identity = readIdentity(tmpDir);
    expect(identity?.description).toBe('covers auth and billing');
  });

  it('writes an identity file without a description and warns', async () => {
    await contextCommand().parseAsync(['init'], { from: 'user' });

    const identity = readIdentity(tmpDir);
    expect(identity).not.toBeNull();
    expect(identity?.description).toBeUndefined();
    expect(logLines.join('\n')).toContain('no description set');
  });

  it('is a no-op when an identity file already exists', async () => {
    await contextCommand().parseAsync(['init', '--description', 'first'], { from: 'user' });
    await contextCommand().parseAsync(['init', '--description', 'second'], { from: 'user' });

    const identity = readIdentity(tmpDir);
    expect(identity?.description).toBe('first');
    expect(logLines.join('\n')).toContain('already exists');
  });
});

describe('oprim context register', () => {
  it('registers a local-path source and shows its canonical description', async () => {
    const repoDir = makeSiblingRepo({ name: 'sibling', description: 'sibling decisions' });

    await contextCommand().parseAsync(
      ['register', '--local', repoDir, '--name', 'sibling'],
      { from: 'user' }
    );

    const config = readRemoteContextConfig(tmpDir);
    expect(config.enabled).toBe(true);
    expect(config.sources).toHaveLength(1);
    expect(config.sources[0]).toMatchObject({ name: 'sibling', path: repoDir });
    expect(logLines.join('\n')).toContain('sibling decisions');
  });

  it('stores a local description note distinct from the canonical description', async () => {
    const repoDir = makeSiblingRepo({ name: 'sibling', description: 'canonical text' });

    await contextCommand().parseAsync(
      ['register', '--local', repoDir, '--name', 'sibling', '--description', 'check before infra bets'],
      { from: 'user' }
    );

    const config = readRemoteContextConfig(tmpDir);
    expect(config.sources[0].description).toBe('check before infra bets');
  });

  it('still registers the source and warns when the identity fetch fails', async () => {
    const missingPath = path.join(tmpDir, 'does-not-exist');

    await contextCommand().parseAsync(
      ['register', '--local', missingPath, '--name', 'ghost'],
      { from: 'user' }
    );

    const config = readRemoteContextConfig(tmpDir);
    expect(config.sources).toHaveLength(1);
    expect(logLines.join('\n')).toContain('Could not confirm this source yet');
  });

  it('notes when the target has no canonical description, without treating it as a failure', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-context-nodesc-'));
    fs.mkdirSync(path.join(dir, '.oprim-context'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.oprim-context', 'context.yaml'), 'name: no-desc\nversion: "1"\n');

    await contextCommand().parseAsync(['register', '--local', dir, '--name', 'no-desc'], { from: 'user' });

    expect(logLines.join('\n')).toContain('no canonical description');
  });

  it('rejects both --git and --local', async () => {
    await expect(
      contextCommand().parseAsync(['register', '--git', 'x', '--local', 'y', '--name', 'z'], { from: 'user' })
    ).rejects.toThrow();
    expect(exitCode).toBe(1);
  });

  it('rejects neither --git nor --local', async () => {
    await expect(
      contextCommand().parseAsync(['register', '--name', 'z'], { from: 'user' })
    ).rejects.toThrow();
    expect(exitCode).toBe(1);
  });

  it('rejects a duplicate name', async () => {
    const repoDir = makeSiblingRepo({ name: 'sibling' });
    await contextCommand().parseAsync(['register', '--local', repoDir, '--name', 'dup'], { from: 'user' });

    await expect(
      contextCommand().parseAsync(['register', '--local', repoDir, '--name', 'dup'], { from: 'user' })
    ).rejects.toThrow();
    expect(exitCode).toBe(1);
    expect(errorLines.join('\n')).toContain('already registered');
  });
});

describe('oprim context list', () => {
  it('reports no remote contexts when none are configured', async () => {
    await contextCommand().parseAsync(['list'], { from: 'user' });
    expect(logLines.join('\n')).toContain('No remote contexts configured');
  });

  it('lists multiple sources with their canonical descriptions', async () => {
    const repoA = makeSiblingRepo({ name: 'alpha', description: 'alpha context' });
    const repoB = makeSiblingRepo({ name: 'beta', description: 'beta context' });

    await contextCommand().parseAsync(['register', '--local', repoA, '--name', 'alpha'], { from: 'user' });
    await contextCommand().parseAsync(['register', '--local', repoB, '--name', 'beta'], { from: 'user' });
    logLines = [];

    await contextCommand().parseAsync(['list'], { from: 'user' });

    const output = logLines.join('\n');
    expect(output).toContain('alpha');
    expect(output).toContain('alpha context');
    expect(output).toContain('beta');
    expect(output).toContain('beta context');
  });

  it('lists an unresolvable source without aborting the rest', async () => {
    const repoGood = makeSiblingRepo({ name: 'good', description: 'good context' });
    await contextCommand().parseAsync(['register', '--local', repoGood, '--name', 'good'], { from: 'user' });
    await contextCommand().parseAsync(
      ['register', '--local', path.join(tmpDir, 'missing'), '--name', 'bad'],
      { from: 'user' }
    );
    logLines = [];

    await contextCommand().parseAsync(['list'], { from: 'user' });

    const output = logLines.join('\n');
    expect(output).toContain('good context');
    expect(output).toContain('unresolved');
  });
});

describe('bare oprim context', () => {
  it('reports no remote contexts when none are configured', async () => {
    await contextCommand().parseAsync([], { from: 'user' });
    expect(logLines.join('\n')).toContain('No remote contexts configured');
  });

  it('prints assembled content for every configured source', async () => {
    const repoDir = makeSiblingRepo({ name: 'sibling' });
    await contextCommand().parseAsync(['register', '--local', repoDir, '--name', 'sibling'], { from: 'user' });
    logLines = [];

    await contextCommand().parseAsync([], { from: 'user' });

    expect(logLines.join('\n')).toContain('PDR-001');
  });

  it('scopes to a single source with --source', async () => {
    const repoA = makeSiblingRepo({ name: 'alpha' });
    const repoB = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-context-beta-'));
    fs.mkdirSync(path.join(repoB, 'oprim', 'bets'), { recursive: true });
    fs.writeFileSync(path.join(repoB, 'oprim', 'bets', 'BET-999.md'), '# BET-999\n');

    await contextCommand().parseAsync(['register', '--local', repoA, '--name', 'alpha'], { from: 'user' });
    await contextCommand().parseAsync(['register', '--local', repoB, '--name', 'beta'], { from: 'user' });
    logLines = [];

    await contextCommand().parseAsync(['--source', 'beta'], { from: 'user' });

    const output = logLines.join('\n');
    expect(output).toContain('BET-999');
    expect(output).not.toContain('PDR-001');
  });

  it('errors on an unknown --source name', async () => {
    const repoA = makeSiblingRepo({ name: 'alpha' });
    await contextCommand().parseAsync(['register', '--local', repoA, '--name', 'alpha'], { from: 'user' });

    await expect(
      contextCommand().parseAsync(['--source', 'nope'], { from: 'user' })
    ).rejects.toThrow();
    expect(exitCode).toBe(1);
  });
});
