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
exports.computeDateWindow = computeDateWindow;
exports.generateAmplitudeDefinition = generateAmplitudeDefinition;
exports.generateBigQuerySQL = generateBigQuerySQL;
exports.classifyStatus = classifyStatus;
exports.writeRunResult = writeRunResult;
exports.runAmplitudeMetric = runAmplitudeMetric;
exports.runBigQueryMetric = runBigQueryMetric;
exports.scanCriteriaForSourceType = scanCriteriaForSourceType;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
// ─── Date window ──────────────────────────────────────────────────────────────
function computeDateWindow(launchDate, timeframe) {
    if (!launchDate)
        return null;
    const match = timeframe.match(/^(\d+)\s+days/);
    if (!match)
        return null;
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
function generateAmplitudeDefinition(metric) {
    const def = metric.source.definition;
    const window = computeDateWindow(metric.launch_date ?? null, metric.timeframe);
    const isDenominator = !!def.denominator_event;
    const events = [{ event_type: def.event }];
    if (isDenominator && def.denominator_event) {
        events.push({ event_type: def.denominator_event });
    }
    const result = {
        chart_type: isDenominator ? 'funnel' : 'event_count',
        events,
        aggregation: def.aggregation,
    };
    if (window) {
        result['window'] = window;
    }
    else {
        result['_comment'] = 'launch_date required to compute window';
    }
    const segmentFilters = [];
    if (metric.segment)
        segmentFilters.push(metric.segment);
    result['segment_filters'] = segmentFilters;
    return result;
}
// ─── BigQuery SQL generator ───────────────────────────────────────────────────
function generateBigQuerySQL(metric) {
    const def = metric.source.definition;
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
function buildSQLAggregation(def) {
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
function classifyStatus(actual, target) {
    if (actual === null)
        return 'pending';
    return actual >= target ? 'hit' : 'missed';
}
// ─── Run result writer ────────────────────────────────────────────────────────
function writeRunResult(betId, measurementsDir, results, runDate) {
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
async function runAmplitudeMetric(definitionPath, apiKey) {
    const def = JSON.parse(fs.readFileSync(definitionPath, 'utf-8'));
    if (!def.window) {
        return { actual: null, notes: 'No date window — set launch_date in criteria.yaml' };
    }
    const startDate = def.window.start.replace(/-/g, '');
    const endDate = def.window.end.replace(/-/g, '');
    const auth = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
    let response;
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
    }
    else {
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
    const data = (await response.json());
    const actual = extractAmplitudeScalar(data, def.chart_type);
    return { actual, notes: actual === null ? 'Could not extract scalar from Amplitude response' : null };
}
function extractAmplitudeScalar(data, chartType) {
    if (chartType === 'funnel') {
        const steps = data?.data?.steps;
        if (steps && steps.length > 0) {
            const rate = steps[steps.length - 1]?.overall_conversion_rate;
            return typeof rate === 'number' ? rate : null;
        }
        return null;
    }
    const series = data?.data?.series;
    if (series && series.length > 0 && series[0].length > 0) {
        const val = series[0][0]?.value;
        return typeof val === 'number' ? val : null;
    }
    return null;
}
// ─── BigQuery execution ───────────────────────────────────────────────────────
async function runBigQueryMetric(sqlPath) {
    let BQMod;
    try {
        BQMod = await Promise.resolve().then(() => __importStar(require('@google-cloud/bigquery')));
    }
    catch {
        return { actual: null, notes: '@google-cloud/bigquery not installed' };
    }
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    const bq = new BQMod.BigQuery();
    const [job] = await bq.createQueryJob({ query: sql });
    const [rows] = await job.getQueryResults();
    if (!rows || rows.length === 0) {
        return { actual: null, notes: 'BigQuery query returned zero rows' };
    }
    const firstValue = Object.values(rows[0])[0];
    if (typeof firstValue === 'number')
        return { actual: firstValue, notes: null };
    if (firstValue !== null && firstValue !== undefined) {
        const parsed = parseFloat(String(firstValue));
        if (!isNaN(parsed))
            return { actual: parsed, notes: null };
    }
    return { actual: null, notes: 'Could not extract scalar from BigQuery result' };
}
// ─── Criteria scanner (used by doctor) ───────────────────────────────────────
function scanCriteriaForSourceType(projectRoot, sourceType) {
    const betsDir = path.join(projectRoot, 'oprim', 'bets');
    if (!fs.existsSync(betsDir))
        return false;
    for (const entry of fs.readdirSync(betsDir)) {
        if (entry === 'archived')
            continue;
        const criteriaPath = path.join(betsDir, entry, 'criteria.yaml');
        if (!fs.existsSync(criteriaPath))
            continue;
        try {
            const parsed = yaml.load(fs.readFileSync(criteriaPath, 'utf-8'));
            if (parsed?.metrics?.some((m) => m.source?.type === sourceType))
                return true;
        }
        catch {
            // skip malformed criteria files
        }
    }
    return false;
}
