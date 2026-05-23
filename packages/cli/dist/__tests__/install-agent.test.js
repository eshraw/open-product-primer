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
const install_agent_1 = require("../lib/install-agent");
let tmpDir;
(0, vitest_1.beforeEach)(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
    vitest_1.vi.spyOn(console, 'log').mockImplementation(() => undefined);
});
(0, vitest_1.afterEach)(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vitest_1.vi.restoreAllMocks();
});
// 7.3 ─────────────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('installAgentSkills', () => {
    (0, vitest_1.describe)('claude', () => {
        (0, vitest_1.it)('creates .claude/skills/ directories and SKILL.md files', () => {
            (0, install_agent_1.installAgentSkills)('claude', tmpDir);
            for (const skill of ['oprim-pdr', 'oprim-bet', 'oprim-criteria', 'oprim-review']) {
                const skillPath = path.join(tmpDir, '.claude', 'skills', skill, 'SKILL.md');
                (0, vitest_1.expect)(fs.existsSync(skillPath)).toBe(true);
            }
        });
        (0, vitest_1.it)('creates .claude/commands/oprim/ and command files', () => {
            (0, install_agent_1.installAgentSkills)('claude', tmpDir);
            for (const cmd of ['pdr.md', 'bet.md', 'criteria.md', 'review.md', 'promote.md', 'sequence.md']) {
                const cmdPath = path.join(tmpDir, '.claude', 'commands', 'oprim', cmd);
                (0, vitest_1.expect)(fs.existsSync(cmdPath)).toBe(true);
            }
        });
        (0, vitest_1.it)('creates .claude/ when it does not exist', () => {
            (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(false);
            (0, install_agent_1.installAgentSkills)('claude', tmpDir);
            (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(true);
        });
        (0, vitest_1.it)('emits a notice when .claude/ was created', () => {
            const logSpy = vitest_1.vi.spyOn(console, 'log');
            (0, install_agent_1.installAgentSkills)('claude', tmpDir);
            const notices = logSpy.mock.calls.map((c) => String(c[0]));
            (0, vitest_1.expect)(notices.some((n) => n.includes('.claude/ created'))).toBe(true);
        });
        (0, vitest_1.it)('does not emit a directory-created notice when .claude/ already exists', () => {
            fs.mkdirSync(path.join(tmpDir, '.claude'));
            const logSpy = vitest_1.vi.spyOn(console, 'log');
            (0, install_agent_1.installAgentSkills)('claude', tmpDir);
            const notices = logSpy.mock.calls.map((c) => String(c[0]));
            (0, vitest_1.expect)(notices.some((n) => n.includes('.claude/ created'))).toBe(false);
        });
    });
    (0, vitest_1.describe)('cursor', () => {
        (0, vitest_1.it)('creates .cursor/skills/ directories and SKILL.md files', () => {
            (0, install_agent_1.installAgentSkills)('cursor', tmpDir);
            for (const skill of ['oprim-pdr', 'oprim-bet', 'oprim-criteria', 'oprim-review']) {
                const skillPath = path.join(tmpDir, '.cursor', 'skills', skill, 'SKILL.md');
                (0, vitest_1.expect)(fs.existsSync(skillPath)).toBe(true);
            }
        });
        (0, vitest_1.it)('creates .cursor/commands/ and command files', () => {
            (0, install_agent_1.installAgentSkills)('cursor', tmpDir);
            for (const cmd of ['oprim-pdr.md', 'oprim-bet.md', 'oprim-criteria.md', 'oprim-review.md']) {
                const cmdPath = path.join(tmpDir, '.cursor', 'commands', cmd);
                (0, vitest_1.expect)(fs.existsSync(cmdPath)).toBe(true);
            }
        });
        (0, vitest_1.it)('creates .cursor/ when it does not exist', () => {
            (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.cursor'))).toBe(false);
            (0, install_agent_1.installAgentSkills)('cursor', tmpDir);
            (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, '.cursor'))).toBe(true);
        });
    });
});
