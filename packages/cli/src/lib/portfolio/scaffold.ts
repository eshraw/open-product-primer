import * as path from 'path';
import { writeFileIfAbsent } from '../scaffold';
import { portfolioScaffoldFiles } from './templates';

/**
 * Writes the portfolio layout (PDR-001 §6) on top of the product scaffold. Every file goes through
 * writeFileIfAbsent, so re-running `oprim init --mode portfolio` never touches human-written files.
 * Returns the paths that were newly written.
 */
export function scaffoldPortfolio(projectRoot: string, opts: { okf: boolean }): string[] {
  const written: string[] = [];
  for (const file of portfolioScaffoldFiles(opts.okf)) {
    if (writeFileIfAbsent(path.join(projectRoot, ...file.path.split('/')), file.content)) {
      written.push(file.path);
    }
  }
  return written;
}
