import * as path from 'path';
import { resolveBetDirectory } from './spec-delta';

/** Wraps `text` in an OSC 8 terminal hyperlink escape sequence targeting `uri`. */
export function osc8(text: string, uri: string): string {
  return `\x1b]8;;${uri}\x1b\\${text}\x1b]8;;\x1b\\`;
}

function fileUri(absPath: string): string {
  return 'file://' + encodeURI(absPath.split(path.sep).join('/'));
}

/**
 * Resolves `betIdInput` to its `bet-decision.md` path under `betsDir` and returns an OSC 8
 * hyperlink wrapping `text`. Falls back to plain `text` if the bet can't be resolved.
 */
export function hyperlinkBetEntry(betsDir: string, betIdInput: string, text: string): string {
  const dirName = resolveBetDirectory(betsDir, betIdInput);
  if (!dirName) return text;
  const decisionPath = path.join(betsDir, dirName, 'bet-decision.md');
  return osc8(text, fileUri(decisionPath));
}
