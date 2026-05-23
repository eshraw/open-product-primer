"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const vitest_1 = require("vitest");
const init_1 = require("../commands/init");
const update_1 = require("../commands/update");
const detect_1 = require("../lib/detect");
let tmpDir;
(0, vitest_1.beforeEach)(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
    vitest_1.vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vitest_1.vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vitest_1.vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
(0, vitest_1.afterEach)(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vitest_1.vi.restoreAllMocks();
});
// 7.4 ─────────────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('oprim init --agent claude', () => {
    (0, vitest_1.it)('scaffolds primer/ and installs Claude skills without a prompt', async () => {
        const cmd = (0, init_1.initCommand)();
        await cmd.parseAsync(['--agent', 'claude'], { from: 'user' });
        // primer/ structure created
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, 'primer', 'config.yaml'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, 'primer', 'sequence.yaml'))).toBe(true);
        // agents persisted to config
        (0, vitest_1.expect)((0, detect_1.readAgentsFromConfig)(tmpDir)).toEqual(['claude']);
        // Claude skills installed
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'pdr.md'))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'oprim-pdr', 'SKILL.md'))).toBe(true);
        // Cursor NOT installed
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.cursor'))).toBe(false);
    });
});
// 7.5 ─────────────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('oprim init --agent unknown', () => {
    (0, vitest_1.it)('exits non-zero with an error message listing supported agents', async () => {
        const exitSpy = vitest_1.vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }));
        const errorSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => undefined);
        await (0, vitest_1.expect)((0, init_1.initCommand)().parseAsync(['--agent', 'unknown-tool'], { from: 'user' })).rejects.toThrow('process.exit called');
        (0, vitest_1.expect)(exitSpy).toHaveBeenCalledWith(1);
        const errorOutput = errorSpy.mock.calls.map((c) => String(c[0])).join('\n');
        (0, vitest_1.expect)(errorOutput).toContain('unknown-tool');
        (0, vitest_1.expect)(errorOutput).toContain('claude');
        (0, vitest_1.expect)(errorOutput).toContain('cursor');
    });
});
// 7.6 ─────────────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('oprim update with agents: [claude] in config', () => {
    (0, vitest_1.it)('installs only Claude skills even when .cursor/ exists', async () => {
        // Bootstrap: primer with agents: [claude] and a pre-existing .cursor/
        fs.mkdirSync(path.join(tmpDir, 'primer'));
        fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nagents:\n  - claude\n');
        fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true });
        const cmd = (0, update_1.updateCommand)();
        await cmd.parseAsync([], { from: 'user' });
        // Claude skills installed
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'pdr.md'))).toBe(true);
        // Cursor commands NOT installed (even though .cursor/ exists)
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.cursor', 'commands', 'oprim-pdr.md'))).toBe(false);
    });
});
