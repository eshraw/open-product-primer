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
export declare function computeDateWindow(launchDate: string | null, timeframe: string): DateWindow | null;
export declare function generateAmplitudeDefinition(metric: CriteriaMetric): Record<string, unknown>;
export declare function generateBigQuerySQL(metric: CriteriaMetric): string;
export declare function classifyStatus(actual: number | null, target: number): 'hit' | 'missed' | 'pending';
export declare function writeRunResult(betId: string, measurementsDir: string, results: MetricResult[], runDate: string): void;
export declare function runAmplitudeMetric(definitionPath: string, apiKey: string): Promise<{
    actual: number | null;
    notes: string | null;
}>;
export declare function runBigQueryMetric(sqlPath: string): Promise<{
    actual: number | null;
    notes: string | null;
}>;
export declare function scanCriteriaForSourceType(projectRoot: string, sourceType: string): boolean;
