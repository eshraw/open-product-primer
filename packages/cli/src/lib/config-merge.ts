// Additive, non-destructive merge for oprim/config.yaml. Each entry here is a top-level
// key path introduced to the schema after the project's original `now: 2` baseline. The
// merge never parses+re-dumps the file (which would risk reordering/reformatting existing
// content) — it only appends the block for a key that isn't already present.
interface ConfigSchemaField {
  key: string;
  block: string;
}

const CONFIG_SCHEMA_FIELDS: ConfigSchemaField[] = [
  { key: 'context', block: 'context: ""\n' },
  { key: 'rules', block: 'rules: {}\n' },
  { key: 'store', block: 'store:\n  enabled: false\n' },
];

function existingTopLevelKeys(content: string): Set<string> {
  const keys = new Set<string>();
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Za-z_][\w-]*):/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

export function mergeConfigSchema(existingContent: string): { content: string; changed: boolean } {
  const present = existingTopLevelKeys(existingContent);
  const missing = CONFIG_SCHEMA_FIELDS.filter((field) => !present.has(field.key));
  if (missing.length === 0) return { content: existingContent, changed: false };

  const separator = existingContent.endsWith('\n') ? '' : '\n';
  const additions = missing.map((field) => field.block).join('');
  return { content: existingContent + separator + additions, changed: true };
}

// bet-023 — integrations.spec_framework is nested under `integrations:` rather than a
// top-level key, and its default depends on the project's existing openspec state, so it
// can't reuse the static CONFIG_SCHEMA_FIELDS table above. Handled as its own one-off per
// the bet's design (falls back to a minimal merge rather than depending on the generic
// top-level mechanism, which doesn't support nested keys or computed defaults).
export function readSpecFramework(content: string): string | null {
  const match = content.match(/^\s*spec_framework:\s*(\S+)/m);
  return match ? match[1] : null;
}

export function deriveDefaultSpecFramework(content: string): string {
  return /^\s*openspec:\n\s*enabled:\s*true/m.test(content) ? 'openspec' : 'none';
}

export function mergeSpecFramework(existingContent: string, framework: string): { content: string; changed: boolean } {
  if (readSpecFramework(existingContent)) return { content: existingContent, changed: false };

  const lines = existingContent.split('\n');
  const integrationsIndex = lines.findIndex((line) => line === 'integrations:');
  if (integrationsIndex === -1) {
    const separator = existingContent.endsWith('\n') ? '' : '\n';
    return { content: existingContent + separator + `integrations:\n  spec_framework: ${framework}\n`, changed: true };
  }
  lines.splice(integrationsIndex + 1, 0, `  spec_framework: ${framework}`);
  return { content: lines.join('\n'), changed: true };
}
