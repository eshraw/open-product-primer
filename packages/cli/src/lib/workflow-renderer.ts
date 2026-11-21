import { loadWorkflowSchema, loadWorkflowTemplate, loadWorkflowVariant, workflowIdsFor, WorkflowSchema } from './workflow-schema';
import type { WorkspaceMode } from './workspace-mode';
import { applyAskFirstBlocks, askFirstEnabled, renderContextFor, type RenderContext } from './workflow-rules';

function claudeWrapper(name: string, description: string, body: string): string {
  return `---
name: "${name}"
description: ${description}
category: Workflow
tags: [workflow, primer]
---

${description}.

${body}`;
}

function cursorWrapper(id: string, description: string, body: string): string {
  return `---
name: /${id}
id: ${id}
category: Workflow
description: ${description}
---

${body}`;
}

function promoteVariantBody(id: string, schema: WorkflowSchema, framework: string): string {
  const variants = schema.variants;
  if (!variants) throw new Error(`workflow "${id}" has no variants configured`);
  const variantId = variants.includes(framework) ? framework : variants[0];
  const content = loadWorkflowVariant(`${id}.${variantId}.template.md`);
  if (content === null) {
    throw new Error(`Missing variant template ${id}.${variantId}.template.md for workflow "${id}"`);
  }
  return content;
}

/**
 * The full workflow body — a workflow's own frontmatter (`name:`/`description:`) plus its
 * instructional steps — used verbatim as the Claude/Cursor/Poolside SKILL.md content.
 */
export function renderSkillBody(id: string, projectRoot?: string, ctx?: RenderContext): string {
  const context = ctx ?? renderContextFor(projectRoot);
  return applyAskFirstBlocks(loadWorkflowTemplate(id, projectRoot), askFirstEnabled(id, context));
}

/**
 * A thin Claude command wrapper that delegates to the workflow's skill via the Skill tool
 * (archive/sequence/context), or promote's dynamic per-framework content.
 */
export function renderClaudeCommand(id: string, projectRoot?: string, framework = 'openspec'): string {
  const schema = loadWorkflowSchema(id, projectRoot);
  if (!schema.claude.command) {
    throw new Error(`workflow "${id}" has no Claude command target`);
  }
  const body = schema.variants
    ? promoteVariantBody(id, schema, framework)
    : schema.skillName
      ? `Use the Skill tool to invoke the \`${schema.skillName}\` skill.`
      : (() => {
          throw new Error(`workflow "${id}" Claude command has neither a skillName nor variants`);
        })();
  return claudeWrapper(schema.title ?? schema.id, schema.description, body);
}

/**
 * A full Cursor command file: promote's dynamic per-framework content, or a condensed
 * `<id>.cursor-command.md` body (Cursor has no Skill tool, so content is always inlined).
 */
export function renderCursorCommand(
  id: string,
  projectRoot?: string,
  framework = 'openspec',
  ctx?: RenderContext
): string {
  const schema = loadWorkflowSchema(id, projectRoot);
  if (!schema.cursor.command) {
    throw new Error(`workflow "${id}" has no Cursor command target`);
  }
  const cursorId = schema.cursor.command.replace(/\.md$/, '');
  const body = schema.variants
    ? promoteVariantBody(id, schema, framework)
    : (() => {
        const content = loadWorkflowVariant(`${id}.cursor-command.md`);
        if (content === null) throw new Error(`Missing ${id}.cursor-command.md for workflow "${id}"`);
        return content;
      })();
  const context = ctx ?? renderContextFor(projectRoot);
  return cursorWrapper(
    cursorId,
    schema.cursorDescription ?? schema.description,
    applyAskFirstBlocks(body, askFirstEnabled(id, context))
  );
}

/** A workflow's condensed section for the shared Codex/Gemini/Poolside inline instruction block. */
export function renderInlineSection(id: string, ctx?: RenderContext): string | null {
  const content = loadWorkflowVariant(`${id}.inline.md`);
  if (content === null) return null;
  return applyAskFirstBlocks(content, askFirstEnabled(id, ctx ?? renderContextFor()));
}

/**
 * The full `<!-- oprim:start -->`-delimited inline instruction block written into AGENTS.md/GEMINI.md.
 * Sections are the `inline: true` workflows for `mode`, in schema `order` (BET-075) — the bundled
 * `order:` values reproduce the pre-refactor fixed section order, so product output is unchanged.
 */
export function renderAgentInstructions(mode: WorkspaceMode = 'product', projectRoot?: string): string {
  const ctx: RenderContext = { mode, askFirst: projectRoot ? renderContextFor(projectRoot).askFirst : {} };
  const sections = workflowIdsFor('inline', mode, projectRoot).map((id) => {
    const content = renderInlineSection(id, ctx);
    if (content === null) throw new Error(`Missing inline section for workflow "${id}"`);
    return content;
  });
  return '\n## oprim workflows\n\n' + sections.join('\n\n') + '\n';
}
