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
const measure_1 = require("../lib/measure");
const measure_2 = require("../commands/measure");
let tmpDir;
(0, vitest_1.beforeEach)(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-measure-test-'));
    vitest_1.vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vitest_1.vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vitest_1.vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
(0, vitest_1.afterEach)(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vitest_1.vi.restoreAllMocks();
});
// ─── 8.1 Date window computation ─────────────────────────────────────────────
(0, vitest_1.describe)('computeDateWindow', () => {
    (0, vitest_1.it)('computes window from standard timeframe string', () => {
        const result = (0, measure_1.computeDateWindow)('2024-03-01', '30 days post-launch');
        (0, vitest_1.expect)(result).toEqual({ start: '2024-03-01', end: '2024-03-31' });
    });
    (0, vitest_1.it)('computes 7-day window correctly', () => {
        const result = (0, measure_1.computeDateWindow)('2024-01-01', '7 days post-launch');
        (0, vitest_1.expect)(result).toEqual({ start: '2024-01-01', end: '2024-01-08' });
    });
    (0, vitest_1.it)('handles month boundary', () => {
        const result = (0, measure_1.computeDateWindow)('2024-01-28', '30 days post-launch');
        (0, vitest_1.expect)(result).toEqual({ start: '2024-01-28', end: '2024-02-27' });
    });
    (0, vitest_1.it)('returns null when launch_date is null', () => {
        (0, vitest_1.expect)((0, measure_1.computeDateWindow)(null, '30 days post-launch')).toBeNull();
    });
    (0, vitest_1.it)('returns null when timeframe does not contain a day count', () => {
        (0, vitest_1.expect)((0, measure_1.computeDateWindow)('2024-03-01', 'quarterly')).toBeNull();
    });
});
// ─── 8.2 Amplitude JSON generator ────────────────────────────────────────────
const baseAmplitudeMetric = {
    id: 'activation_rate',
    name: 'Activation Rate',
    baseline: 0.2,
    target: 0.3,
    timeframe: '30 days post-launch',
    launch_date: '2024-03-01',
    source: {
        type: 'amplitude',
        definition: {
            event: 'user_activated',
            aggregation: 'unique_users',
            denominator_event: null,
        },
    },
    segment: null,
};
(0, vitest_1.describe)('generateAmplitudeDefinition', () => {
    (0, vitest_1.it)('uses event_count chart type when no denominator', () => {
        const result = (0, measure_1.generateAmplitudeDefinition)(baseAmplitudeMetric);
        (0, vitest_1.expect)(result['chart_type']).toBe('event_count');
        (0, vitest_1.expect)(result['events']).toEqual([{ event_type: 'user_activated' }]);
        (0, vitest_1.expect)(result['aggregation']).toBe('unique_users');
    });
    (0, vitest_1.it)('uses funnel chart type with denominator event', () => {
        const metric = {
            ...baseAmplitudeMetric,
            source: {
                type: 'amplitude',
                definition: {
                    event: 'checkout_started',
                    aggregation: 'unique_users',
                    denominator_event: 'page_viewed',
                },
            },
        };
        const result = (0, measure_1.generateAmplitudeDefinition)(metric);
        (0, vitest_1.expect)(result['chart_type']).toBe('funnel');
        (0, vitest_1.expect)(result['events']).toEqual([{ event_type: 'checkout_started' }, { event_type: 'page_viewed' }]);
    });
    (0, vitest_1.it)('includes window when launch_date is set', () => {
        const result = (0, measure_1.generateAmplitudeDefinition)(baseAmplitudeMetric);
        (0, vitest_1.expect)(result['window']).toEqual({ start: '2024-03-01', end: '2024-03-31' });
        (0, vitest_1.expect)(result['_comment']).toBeUndefined();
    });
    (0, vitest_1.it)('omits window and adds _comment when launch_date is null', () => {
        const metric = { ...baseAmplitudeMetric, launch_date: null };
        const result = (0, measure_1.generateAmplitudeDefinition)(metric);
        (0, vitest_1.expect)(result['window']).toBeUndefined();
        (0, vitest_1.expect)(result['_comment']).toContain('launch_date required');
    });
    (0, vitest_1.it)('includes segment filter when segment is set', () => {
        const metric = { ...baseAmplitudeMetric, segment: 'country = US' };
        const result = (0, measure_1.generateAmplitudeDefinition)(metric);
        (0, vitest_1.expect)(result['segment_filters']).toEqual(['country = US']);
    });
    (0, vitest_1.it)('has empty segment_filters when segment is null', () => {
        const result = (0, measure_1.generateAmplitudeDefinition)(baseAmplitudeMetric);
        (0, vitest_1.expect)(result['segment_filters']).toEqual([]);
    });
});
// ─── 8.3 BigQuery SQL generator ───────────────────────────────────────────────
const baseBigQueryMetric = {
    id: 'revenue_total',
    name: 'Total Revenue',
    baseline: 10000,
    target: 15000,
    timeframe: '30 days post-launch',
    launch_date: '2024-03-01',
    source: {
        type: 'bigquery',
        definition: {
            table: 'project.dataset.orders',
            metric_column: 'revenue',
            filter: 'status = "completed"',
            aggregation: 'sum',
            denominator_query: null,
        },
    },
};
(0, vitest_1.describe)('generateBigQuerySQL', () => {
    (0, vitest_1.it)('generates SUM query', () => {
        const sql = (0, measure_1.generateBigQuerySQL)(baseBigQueryMetric);
        (0, vitest_1.expect)(sql).toContain('SELECT SUM(revenue)');
        (0, vitest_1.expect)(sql).toContain('FROM `project.dataset.orders`');
        (0, vitest_1.expect)(sql).toContain('WHERE (status = "completed")');
        (0, vitest_1.expect)(sql).toContain("BETWEEN '2024-03-01' AND '2024-03-31'");
    });
    (0, vitest_1.it)('generates COUNT(DISTINCT ...) for count_distinct aggregation', () => {
        const metric = {
            ...baseBigQueryMetric,
            source: {
                type: 'bigquery',
                definition: {
                    table: 'project.dataset.users',
                    metric_column: 'user_id',
                    filter: 'is_active = true',
                    aggregation: 'count_distinct',
                    denominator_query: null,
                },
            },
        };
        const sql = (0, measure_1.generateBigQuerySQL)(metric);
        (0, vitest_1.expect)(sql).toContain('SELECT COUNT(DISTINCT user_id)');
    });
    (0, vitest_1.it)('generates rate query with denominator', () => {
        const metric = {
            ...baseBigQueryMetric,
            source: {
                type: 'bigquery',
                definition: {
                    table: 'project.dataset.orders',
                    metric_column: 'revenue',
                    filter: 'status = "completed"',
                    aggregation: 'sum',
                    denominator_query: 'SELECT COUNT(*) FROM `project.dataset.orders`',
                },
            },
        };
        const sql = (0, measure_1.generateBigQuerySQL)(metric);
        (0, vitest_1.expect)(sql).toContain('SELECT (');
        (0, vitest_1.expect)(sql).toContain(') / (');
        (0, vitest_1.expect)(sql).toContain('SELECT COUNT(*) FROM `project.dataset.orders`');
    });
    (0, vitest_1.it)('includes header comment with baseline and target', () => {
        const sql = (0, measure_1.generateBigQuerySQL)(baseBigQueryMetric);
        (0, vitest_1.expect)(sql).toContain('-- Metric: Total Revenue');
        (0, vitest_1.expect)(sql).toContain('-- Baseline: 10000 | Target: 15000');
    });
    (0, vitest_1.it)('includes window comment when launch_date is null', () => {
        const metric = { ...baseBigQueryMetric, launch_date: null };
        const sql = (0, measure_1.generateBigQuerySQL)(metric);
        (0, vitest_1.expect)(sql).toContain('launch_date required to compute window');
    });
});
// ─── 8.4 Status classification ───────────────────────────────────────────────
(0, vitest_1.describe)('classifyStatus', () => {
    (0, vitest_1.it)('returns hit when actual equals target', () => {
        (0, vitest_1.expect)((0, measure_1.classifyStatus)(5, 5)).toBe('hit');
    });
    (0, vitest_1.it)('returns hit when actual exceeds target', () => {
        (0, vitest_1.expect)((0, measure_1.classifyStatus)(6, 5)).toBe('hit');
    });
    (0, vitest_1.it)('returns missed when actual is below target', () => {
        (0, vitest_1.expect)((0, measure_1.classifyStatus)(4.9, 5)).toBe('missed');
    });
    (0, vitest_1.it)('returns missed when actual is 0 and target is positive', () => {
        (0, vitest_1.expect)((0, measure_1.classifyStatus)(0, 1)).toBe('missed');
    });
    (0, vitest_1.it)('returns pending when actual is null', () => {
        (0, vitest_1.expect)((0, measure_1.classifyStatus)(null, 5)).toBe('pending');
    });
});
// ─── 8.5 Integration: oprim measure --dry-run ────────────────────────────────
const fixtureCriteria = `
metrics:
  - id: activation_rate
    name: Activation Rate
    baseline: 0.20
    target: 0.30
    timeframe: "30 days post-launch"
    launch_date: "2024-03-01"
    source:
      type: amplitude
      definition:
        event: user_activated
        aggregation: unique_users
        denominator_event: null
    segment: null
  - id: revenue_total
    name: Total Revenue
    baseline: 10000
    target: 15000
    timeframe: "30 days post-launch"
    launch_date: "2024-03-01"
    source:
      type: bigquery
      definition:
        table: "project.dataset.orders"
        metric_column: revenue
        filter: "status = 'completed'"
        aggregation: sum
        denominator_query: null
`.trim();
(0, vitest_1.describe)('oprim measure --dry-run', () => {
    (0, vitest_1.beforeEach)(() => {
        const betDir = path.join(tmpDir, 'primer', 'bets', 'BET-001');
        fs.mkdirSync(betDir, { recursive: true });
        fs.writeFileSync(path.join(betDir, 'criteria.yaml'), fixtureCriteria);
    });
    (0, vitest_1.it)('generates definition files without writing a run result', async () => {
        await (0, measure_2.measureCommand)().parseAsync(['BET-001', '--dry-run'], { from: 'user' });
        const measureDir = path.join(tmpDir, 'primer', 'bets', 'BET-001', 'measurements');
        (0, vitest_1.expect)(fs.existsSync(measureDir)).toBe(true);
        // Amplitude definition written
        const ampPath = path.join(measureDir, 'amplitude-activation_rate.json');
        (0, vitest_1.expect)(fs.existsSync(ampPath)).toBe(true);
        const ampDef = JSON.parse(fs.readFileSync(ampPath, 'utf-8'));
        (0, vitest_1.expect)(ampDef.chart_type).toBe('event_count');
        (0, vitest_1.expect)(ampDef.window).toEqual({ start: '2024-03-01', end: '2024-03-31' });
        // BigQuery SQL written
        const sqlPath = path.join(measureDir, 'bigquery-revenue_total.sql');
        (0, vitest_1.expect)(fs.existsSync(sqlPath)).toBe(true);
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        (0, vitest_1.expect)(sql).toContain('SELECT SUM(revenue)');
        // No run result written
        const runFiles = fs.readdirSync(measureDir).filter((f) => f.startsWith('run-'));
        (0, vitest_1.expect)(runFiles).toHaveLength(0);
    });
    (0, vitest_1.it)('exits non-zero when bet directory does not exist', async () => {
        const exitSpy = vitest_1.vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }));
        await (0, vitest_1.expect)((0, measure_2.measureCommand)().parseAsync(['BET-999', '--dry-run'], { from: 'user' })).rejects.toThrow('process.exit called');
        (0, vitest_1.expect)(exitSpy).toHaveBeenCalledWith(1);
    });
    (0, vitest_1.it)('exits non-zero when criteria.yaml is missing', async () => {
        const betDir = path.join(tmpDir, 'primer', 'bets', 'BET-002');
        fs.mkdirSync(betDir, { recursive: true });
        const exitSpy = vitest_1.vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }));
        await (0, vitest_1.expect)((0, measure_2.measureCommand)().parseAsync(['BET-002', '--dry-run'], { from: 'user' })).rejects.toThrow('process.exit called');
        (0, vitest_1.expect)(exitSpy).toHaveBeenCalledWith(1);
    });
});
