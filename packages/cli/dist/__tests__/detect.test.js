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
const detect_1 = require("../lib/detect");
let tmpDir;
(0, vitest_1.beforeEach)(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
});
(0, vitest_1.afterEach)(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});
// 7.1 ─────────────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('readAgentsFromConfig', () => {
    (0, vitest_1.it)('returns null when primer/config.yaml does not exist', () => {
        (0, vitest_1.expect)((0, detect_1.readAgentsFromConfig)(tmpDir)).toBeNull();
    });
    (0, vitest_1.it)('returns null when agents field is absent', () => {
        fs.mkdirSync(path.join(tmpDir, 'primer'));
        fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nproject:\n  name: test\n');
        (0, vitest_1.expect)((0, detect_1.readAgentsFromConfig)(tmpDir)).toBeNull();
    });
    (0, vitest_1.it)('returns empty array when agents field is an empty list', () => {
        fs.mkdirSync(path.join(tmpDir, 'primer'));
        fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nagents: []\n');
        (0, vitest_1.expect)((0, detect_1.readAgentsFromConfig)(tmpDir)).toEqual([]);
    });
    (0, vitest_1.it)('returns array of agents when field is present', () => {
        fs.mkdirSync(path.join(tmpDir, 'primer'));
        fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nagents:\n  - claude\n  - cursor\n');
        (0, vitest_1.expect)((0, detect_1.readAgentsFromConfig)(tmpDir)).toEqual(['claude', 'cursor']);
    });
});
// 7.2 ─────────────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('writeAgentsToConfig', () => {
    (0, vitest_1.beforeEach)(() => {
        fs.mkdirSync(path.join(tmpDir, 'primer'));
        fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nproject:\n  name: my-project\nagents: []\nmeasurement:\n  amplitude:\n    enabled: false\n');
    });
    (0, vitest_1.it)('writes selected agents to config', () => {
        (0, detect_1.writeAgentsToConfig)(['claude'], tmpDir);
        const result = (0, detect_1.readAgentsFromConfig)(tmpDir);
        (0, vitest_1.expect)(result).toEqual(['claude']);
    });
    (0, vitest_1.it)('does not clobber other config fields', () => {
        (0, detect_1.writeAgentsToConfig)(['claude'], tmpDir);
        const content = fs.readFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'utf-8');
        (0, vitest_1.expect)(content).toContain('my-project');
        (0, vitest_1.expect)(content).toContain('amplitude');
        (0, vitest_1.expect)(content).toContain('version');
    });
    (0, vitest_1.it)('updates agents field from empty to a list', () => {
        (0, detect_1.writeAgentsToConfig)(['claude', 'cursor'], tmpDir);
        (0, vitest_1.expect)((0, detect_1.readAgentsFromConfig)(tmpDir)).toEqual(['claude', 'cursor']);
    });
    (0, vitest_1.it)('is a no-op when config file does not exist', () => {
        fs.rmSync(path.join(tmpDir, 'primer', 'config.yaml'));
        (0, vitest_1.expect)(() => (0, detect_1.writeAgentsToConfig)(['claude'], tmpDir)).not.toThrow();
    });
});
