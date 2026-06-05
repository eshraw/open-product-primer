import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  computeDateWindow,
  generateAmplitudeDefinition,
  generateBigQuerySQL,
  classifyStatus,
  scanCriteriaForSourceType,
  CriteriaMetric,
} from '../lib/measure';
import { measureCommand } from '../commands/measure';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-measure-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ─── 8.1 Date window computation ─────────────────────────────────────────────

describe('computeDateWindow', () => {
  it('computes window from standard timeframe string', () => {
    const result = computeDateWindow('2024-03-01', '30 days post-launch');
    expect(result).toEqual({ start: '2024-03-01', end: '2024-03-31' });
  });

  it('computes 7-day window correctly', () => {
    const result = computeDateWindow('2024-01-01', '7 days post-launch');
    expect(result).toEqual({ start: '2024-01-01', end: '2024-01-08' });
  });

  it('handles month boundary', () => {
    const result = computeDateWindow('2024-01-28', '30 days post-launch');
    expect(result).toEqual({ start: '2024-01-28', end: '2024-02-27' });
  });

  it('returns null when launch_date is null', () => {
    expect(computeDateWindow(null, '30 days post-launch')).toBeNull();
  });

  it('returns null when timeframe does not contain a day count', () => {
    expect(computeDateWindow('2024-03-01', 'quarterly')).toBeNull();
  });
});

// ─── 8.2 Amplitude JSON generator ────────────────────────────────────────────

const baseAmplitudeMetric: CriteriaMetric = {
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

describe('generateAmplitudeDefinition', () => {
  it('uses event_count chart type when no denominator', () => {
    const result = generateAmplitudeDefinition(baseAmplitudeMetric);
    expect(result['chart_type']).toBe('event_count');
    expect(result['events']).toEqual([{ event_type: 'user_activated' }]);
    expect(result['aggregation']).toBe('unique_users');
  });

  it('uses funnel chart type with denominator event', () => {
    const metric = {
      ...baseAmplitudeMetric,
      source: {
        type: 'amplitude' as const,
        definition: {
          event: 'checkout_started',
          aggregation: 'unique_users',
          denominator_event: 'page_viewed',
        },
      },
    };
    const result = generateAmplitudeDefinition(metric);
    expect(result['chart_type']).toBe('funnel');
    expect(result['events']).toEqual([{ event_type: 'checkout_started' }, { event_type: 'page_viewed' }]);
  });

  it('includes window when launch_date is set', () => {
    const result = generateAmplitudeDefinition(baseAmplitudeMetric);
    expect(result['window']).toEqual({ start: '2024-03-01', end: '2024-03-31' });
    expect(result['_comment']).toBeUndefined();
  });

  it('omits window and adds _comment when launch_date is null', () => {
    const metric = { ...baseAmplitudeMetric, launch_date: null };
    const result = generateAmplitudeDefinition(metric);
    expect(result['window']).toBeUndefined();
    expect(result['_comment']).toContain('launch_date required');
  });

  it('includes segment filter when segment is set', () => {
    const metric = { ...baseAmplitudeMetric, segment: 'country = US' };
    const result = generateAmplitudeDefinition(metric);
    expect(result['segment_filters']).toEqual(['country = US']);
  });

  it('has empty segment_filters when segment is null', () => {
    const result = generateAmplitudeDefinition(baseAmplitudeMetric);
    expect(result['segment_filters']).toEqual([]);
  });
});

// ─── 8.3 BigQuery SQL generator ───────────────────────────────────────────────

const baseBigQueryMetric: CriteriaMetric = {
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

describe('generateBigQuerySQL', () => {
  it('generates SUM query', () => {
    const sql = generateBigQuerySQL(baseBigQueryMetric);
    expect(sql).toContain('SELECT SUM(revenue)');
    expect(sql).toContain('FROM `project.dataset.orders`');
    expect(sql).toContain('WHERE (status = "completed")');
    expect(sql).toContain("BETWEEN '2024-03-01' AND '2024-03-31'");
  });

  it('generates COUNT(DISTINCT ...) for count_distinct aggregation', () => {
    const metric = {
      ...baseBigQueryMetric,
      source: {
        type: 'bigquery' as const,
        definition: {
          table: 'project.dataset.users',
          metric_column: 'user_id',
          filter: 'is_active = true',
          aggregation: 'count_distinct',
          denominator_query: null,
        },
      },
    };
    const sql = generateBigQuerySQL(metric);
    expect(sql).toContain('SELECT COUNT(DISTINCT user_id)');
  });

  it('generates rate query with denominator', () => {
    const metric = {
      ...baseBigQueryMetric,
      source: {
        type: 'bigquery' as const,
        definition: {
          table: 'project.dataset.orders',
          metric_column: 'revenue',
          filter: 'status = "completed"',
          aggregation: 'sum',
          denominator_query: 'SELECT COUNT(*) FROM `project.dataset.orders`',
        },
      },
    };
    const sql = generateBigQuerySQL(metric);
    expect(sql).toContain('SELECT (');
    expect(sql).toContain(') / (');
    expect(sql).toContain('SELECT COUNT(*) FROM `project.dataset.orders`');
  });

  it('includes header comment with baseline and target', () => {
    const sql = generateBigQuerySQL(baseBigQueryMetric);
    expect(sql).toContain('-- Metric: Total Revenue');
    expect(sql).toContain('-- Baseline: 10000 | Target: 15000');
  });

  it('includes window comment when launch_date is null', () => {
    const metric = { ...baseBigQueryMetric, launch_date: null };
    const sql = generateBigQuerySQL(metric);
    expect(sql).toContain('launch_date required to compute window');
  });
});

// ─── 8.4 Status classification ───────────────────────────────────────────────

describe('classifyStatus', () => {
  it('returns hit when actual equals target', () => {
    expect(classifyStatus(5, 5)).toBe('hit');
  });

  it('returns hit when actual exceeds target', () => {
    expect(classifyStatus(6, 5)).toBe('hit');
  });

  it('returns missed when actual is below target', () => {
    expect(classifyStatus(4.9, 5)).toBe('missed');
  });

  it('returns missed when actual is 0 and target is positive', () => {
    expect(classifyStatus(0, 1)).toBe('missed');
  });

  it('returns pending when actual is null', () => {
    expect(classifyStatus(null, 5)).toBe('pending');
  });
});

// ─── 8.4b scanCriteriaForSourceType ──────────────────────────────────────────

const amplitudeCriteria = `
metrics:
  - id: activation_rate
    name: Activation Rate
    baseline: 0.20
    target: 0.30
    timeframe: "30 days post-launch"
    launch_date: null
    source:
      type: amplitude
      definition:
        event: user_activated
        aggregation: unique_users
        denominator_event: null
    segment: null
`.trim();

describe('scanCriteriaForSourceType', () => {
  it('returns true when an active bet has a matching source type', () => {
    const betDir = path.join(tmpDir, 'oprim', 'bets', 'BET-007');
    fs.mkdirSync(betDir, { recursive: true });
    fs.writeFileSync(path.join(betDir, 'criteria.yaml'), amplitudeCriteria);

    expect(scanCriteriaForSourceType(tmpDir, 'amplitude')).toBe(true);
  });

  it('returns false when no active bet has a matching source type', () => {
    const betDir = path.join(tmpDir, 'oprim', 'bets', 'BET-007');
    fs.mkdirSync(betDir, { recursive: true });
    fs.writeFileSync(path.join(betDir, 'criteria.yaml'), amplitudeCriteria);

    expect(scanCriteriaForSourceType(tmpDir, 'bigquery')).toBe(false);
  });

  it('returns false when the only matching criteria.yaml is in an archived bet', () => {
    const archivedBetDir = path.join(tmpDir, 'oprim', 'bets', 'archived', 'BET-002');
    fs.mkdirSync(archivedBetDir, { recursive: true });
    fs.writeFileSync(path.join(archivedBetDir, 'criteria.yaml'), amplitudeCriteria);

    expect(scanCriteriaForSourceType(tmpDir, 'amplitude')).toBe(false);
  });

  it('returns false when oprim/bets/ does not exist', () => {
    expect(scanCriteriaForSourceType(tmpDir, 'amplitude')).toBe(false);
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

describe('oprim measure --dry-run', () => {
  beforeEach(() => {
    const betDir = path.join(tmpDir, 'primer', 'bets', 'BET-001');
    fs.mkdirSync(betDir, { recursive: true });
    fs.writeFileSync(path.join(betDir, 'criteria.yaml'), fixtureCriteria);
  });

  it('generates definition files without writing a run result', async () => {
    await measureCommand().parseAsync(['BET-001', '--dry-run'], { from: 'user' });

    const measureDir = path.join(tmpDir, 'primer', 'bets', 'BET-001', 'measurements');
    expect(fs.existsSync(measureDir)).toBe(true);

    // Amplitude definition written
    const ampPath = path.join(measureDir, 'amplitude-activation_rate.json');
    expect(fs.existsSync(ampPath)).toBe(true);
    const ampDef = JSON.parse(fs.readFileSync(ampPath, 'utf-8'));
    expect(ampDef.chart_type).toBe('event_count');
    expect(ampDef.window).toEqual({ start: '2024-03-01', end: '2024-03-31' });

    // BigQuery SQL written
    const sqlPath = path.join(measureDir, 'bigquery-revenue_total.sql');
    expect(fs.existsSync(sqlPath)).toBe(true);
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    expect(sql).toContain('SELECT SUM(revenue)');

    // No run result written
    const runFiles = fs.readdirSync(measureDir).filter((f) => f.startsWith('run-'));
    expect(runFiles).toHaveLength(0);
  });

  it('exits non-zero when bet directory does not exist', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);

    await expect(measureCommand().parseAsync(['BET-999', '--dry-run'], { from: 'user' })).rejects.toThrow(
      'process.exit called'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits non-zero when criteria.yaml is missing', async () => {
    const betDir = path.join(tmpDir, 'primer', 'bets', 'BET-002');
    fs.mkdirSync(betDir, { recursive: true });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);

    await expect(measureCommand().parseAsync(['BET-002', '--dry-run'], { from: 'user' })).rejects.toThrow(
      'process.exit called'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
