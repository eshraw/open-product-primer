import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AmplitudeDefinition {
  event: string;
  aggregation: string;
  denominator_event?: string | null;
}

export interface BigQueryDefinition {
  table: string;
  metric_column: string;
  filter: string;
  aggregation: string;
  denominator_query?: string | null;
}

export interface CriteriaMetric {
  id: string;
  name: string;
  baseline: number;
  target: number;
  timeframe: string;
  launch_date: string | null;
  source: {
    type: 'amplitude' | 'bigquery';
    definition: AmplitudeDefinition | BigQueryDefinition;
  };
  segment?: string | null;
}

export interface CriteriaFile {
  metrics: CriteriaMetric[];
}

export interface DateWindow {
  start: string;
  end: string;
}

export interface MetricResult {
  id: string;
  name: string;
  source: string;
  actual: number | null;
  target: number;
  status: 'hit' | 'missed' | 'pending';
  notes: string | null;
}

// ─── Date window ──────────────────────────────────────────────────────────────

export function computeDateWindow(launchDate: string | null, timeframe: string): DateWindow | null {
  if (!launchDate) return null;
  const match = timeframe.match(/^(\d+)\s+days/);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  const start = new Date(launchDate + 'T00:00:00Z');
  const end = new Date(launchDate + 'T00:00:00Z');
  end.setUTCDate(end.getUTCDate() + days);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

// ─── Amplitude generator ──────────────────────────────────────────────────────

export function generateAmplitudeDefinition(metric: CriteriaMetric): Record<string, unknown> {
  const def = metric.source.definition as AmplitudeDefinition;
  const window = computeDateWindow(metric.launch_date ?? null, metric.timeframe);
  const isDenominator = !!def.denominator_event;

  const events: Array<{ event_type: string }> = [{ event_type: def.event }];
  if (isDenominator && def.denominator_event) {
    events.push({ event_type: def.denominator_event });
  }

  const result: Record<string, unknown> = {
    chart_type: isDenominator ? 'funnel' : 'event_count',
    events,
    aggregation: def.aggregation,
  };

  if (window) {
    result['window'] = window;
  } else {
    result['_comment'] = 'launch_date required to compute window';
  }

  const segmentFilters: string[] = [];
  if (metric.segment) segmentFilters.push(metric.segment);
  result['segment_filters'] = segmentFilters;

  return result;
}

// ─── BigQuery SQL generator ───────────────────────────────────────────────────

export function generateBigQuerySQL(metric: CriteriaMetric): string {
  const def = metric.source.definition as BigQueryDefinition;
  const window = computeDateWindow(metric.launch_date ?? null, metric.timeframe);

  const windowComment = window
    ? `-- Window: ${window.start} to ${window.end}`
    : '-- launch_date required to compute window';

  const header = [
    `-- Metric: ${metric.name}`,
    `-- Baseline: ${metric.baseline} | Target: ${metric.target}`,
    windowComment,
  ].join('\n');

  const dateFilter = window
    ? `  AND DATE(timestamp) BETWEEN '${window.start}' AND '${window.end}'`
    : `  -- AND DATE(timestamp) BETWEEN <start> AND <end>  -- set launch_date to enable`;

  const agg = buildSQLAggregation(def);

  if (def.denominator_query) {
    const numerator = `SELECT ${agg}\nFROM \`${def.table}\`\nWHERE (${def.filter})\n${dateFilter}`;
    const indented = numerator.split('\n').join('\n  ');
    return `${header}\nSELECT (\n  ${indented}\n) / (\n  ${def.denominator_query}\n)`;
  }

  return `${header}\nSELECT ${agg}\nFROM \`${def.table}\`\nWHERE (${def.filter})\n${dateFilter}`;
}

function buildSQLAggregation(def: BigQueryDefinition): string {
  switch (def.aggregation) {
    case 'count_distinct':
      return `COUNT(DISTINCT ${def.metric_column})`;
    case 'count':
      return `COUNT(${def.metric_column})`;
    case 'avg':
      return `AVG(${def.metric_column})`;
    default:
      return `SUM(${def.metric_column})`;
  }
}

// ─── Status classification ────────────────────────────────────────────────────

export function classifyStatus(actual: number | null, target: number): 'hit' | 'missed' | 'pending' {
  if (actual === null) return 'pending';
  return actual >= target ? 'hit' : 'missed';
}

// ─── Run result writer ────────────────────────────────────────────────────────

export function writeRunResult(
  betId: string,
  measurementsDir: string,
  results: MetricResult[],
  runDate: string
): void {
  const data = {
    bet_id: betId,
    run_date: runDate,
    metrics: results.map((r) => ({
      id: r.id,
      name: r.name,
      source: r.source,
      actual: r.actual,
      target: r.target,
      status: r.status,
      notes: r.notes,
    })),
  };
  fs.writeFileSync(path.join(measurementsDir, `run-${runDate}.yaml`), yaml.dump(data, { indent: 2 }), 'utf-8');
}

// ─── Amplitude execution ──────────────────────────────────────────────────────

export async function runAmplitudeMetric(
  definitionPath: string,
  apiKey: string
): Promise<{ actual: number | null; notes: string | null }> {
  const def = JSON.parse(fs.readFileSync(definitionPath, 'utf-8')) as {
    chart_type: string;
    events: Array<{ event_type: string }>;
    aggregation: string;
    window?: { start: string; end: string };
  };

  if (!def.window) {
    return { actual: null, notes: 'No date window — set launch_date in criteria.yaml' };
  }

  const startDate = def.window.start.replace(/-/g, '');
  const endDate = def.window.end.replace(/-/g, '');
  const auth = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');

  let response: Response;
  if (def.chart_type === 'funnel') {
    response = await fetch('https://amplitude.com/api/2/funnels', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        e: def.events,
        m: def.aggregation === 'unique_users' ? 'UNIQUE' : 'TOTALS',
        start: startDate,
        end: endDate,
      }),
    });
  } else {
    const params = new URLSearchParams({
      e: JSON.stringify({ event_type: def.events[0]?.event_type }),
      m: def.aggregation === 'unique_users' ? 'UNIQUE' : 'TOTALS',
      start: startDate,
      end: endDate,
      i: '30',
    });
    response = await fetch(`https://amplitude.com/api/2/events/segmentation?${params}`, {
      headers: { Authorization: auth },
    });
  }

  if (!response.ok) {
    const text = await response.text();
    return { actual: null, notes: `Amplitude API ${response.status}: ${text.slice(0, 200)}` };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const actual = extractAmplitudeScalar(data, def.chart_type);
  return { actual, notes: actual === null ? 'Could not extract scalar from Amplitude response' : null };
}

function extractAmplitudeScalar(data: Record<string, unknown>, chartType: string): number | null {
  if (chartType === 'funnel') {
    const steps = (data as { data?: { steps?: Array<{ overall_conversion_rate?: number }> } })?.data?.steps;
    if (steps && steps.length > 0) {
      const rate = steps[steps.length - 1]?.overall_conversion_rate;
      return typeof rate === 'number' ? rate : null;
    }
    return null;
  }
  const series = (data as { data?: { series?: Array<Array<{ value?: number }>> } })?.data?.series;
  if (series && series.length > 0 && series[0].length > 0) {
    const val = series[0][0]?.value;
    return typeof val === 'number' ? val : null;
  }
  return null;
}

// ─── BigQuery execution ───────────────────────────────────────────────────────

export async function runBigQueryMetric(sqlPath: string): Promise<{ actual: number | null; notes: string | null }> {
  type BQModule = typeof import('@google-cloud/bigquery');
  let BQMod: BQModule;
  try {
    BQMod = await import('@google-cloud/bigquery');
  } catch {
    return { actual: null, notes: '@google-cloud/bigquery not installed' };
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const bq = new BQMod.BigQuery();

  const [job] = await bq.createQueryJob({ query: sql });
  const [rows] = await job.getQueryResults();

  if (!rows || rows.length === 0) {
    return { actual: null, notes: 'BigQuery query returned zero rows' };
  }

  const firstValue = Object.values(rows[0] as Record<string, unknown>)[0];
  if (typeof firstValue === 'number') return { actual: firstValue, notes: null };
  if (firstValue !== null && firstValue !== undefined) {
    const parsed = parseFloat(String(firstValue));
    if (!isNaN(parsed)) return { actual: parsed, notes: null };
  }

  return { actual: null, notes: 'Could not extract scalar from BigQuery result' };
}

// ─── Criteria scanner (used by doctor) ───────────────────────────────────────

export function scanCriteriaForSourceType(projectRoot: string, sourceType: string): boolean {
  const betsDir = path.join(projectRoot, 'primer', 'bets');
  if (!fs.existsSync(betsDir)) return false;
  for (const entry of fs.readdirSync(betsDir)) {
    const criteriaPath = path.join(betsDir, entry, 'criteria.yaml');
    if (!fs.existsSync(criteriaPath)) continue;
    try {
      const parsed = yaml.load(fs.readFileSync(criteriaPath, 'utf-8')) as {
        metrics?: Array<{ source?: { type?: string } }>;
      };
      if (parsed?.metrics?.some((m) => m.source?.type === sourceType)) return true;
    } catch {
      // skip malformed criteria files
    }
  }
  return false;
}
