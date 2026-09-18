export type Agent = 'claude' | 'cursor' | 'codex' | 'gemini' | 'poolside' | 'vibe' | 'qwen' | 'kimi' | 'dsh';
export declare const SUPPORTED_AGENTS: readonly Agent[];
export declare function promptFrameworkSelection(projectRoot: string): Promise<string>;
export declare function resolveSpecFramework(projectRoot: string): string;
export declare function promptAgentSelection(projectRoot: string): Promise<string[]>;
export declare function promptClaudeModsSelection(preChecked: string[]): Promise<string[]>;
export declare function isFunctionHooksActive(projectRoot: string): boolean;
export declare function promptEnableFunctionHooks(): Promise<boolean>;
export declare function enableFunctionHooks(projectRoot: string): void;
export declare function printManualFunctionHooksActivation(): void;
/**
 * Merges newly-selected mods into the project and removes deselected mods' entries, writing/
 * deleting each mod's files to match. A classic mod's hookFiles merge into .claude/settings.json
 * (additive, non-clobbering — same convention as mergeClaudeSettingsHooks); a plugin mod's
 * pluginFiles are written under .claude/skills/<mod.id>/ instead, where the skills-directory
 * auto-load convention picks it up as a function-hooks plugin — settings.json is untouched for
 * these. Persists the resulting selection to oprim/config.yaml's claude_mods key.
 */
export declare function applyClaudeModsSelection(projectRoot: string, selectedIds: string[], previousIds: string[]): void;
export declare function promptPdrSurfacing(): Promise<boolean>;
export declare function promptOkfFrontmatter(): Promise<boolean>;
export declare function installAgentSkills(agent: Agent, projectRoot: string, framework?: string, pdrSurfacing?: boolean): void;
export declare const OPRIM_CONTEXT_SKILL_STEP = "## Step 0: Check relevant product decisions\nInvoke the `oprim:context` skill using the Skill tool. If matching PDRs are surfaced, review them before proceeding. If no PDRs match or `oprim/decisions/` is empty, the skill exits silently \u2014 continue to Step 1 immediately.";
export declare const CLAUDE_SKILLS: Record<string, string>;
export declare const CLAUDE_COMMANDS: Record<string, string>;
export declare const POOLSIDE_SKILLS: Record<string, string>;
export declare const VIBE_SKILLS: Record<string, string>;
export declare const QWEN_SKILLS: Record<string, string>;
export declare const KIMI_SKILLS: Record<string, string>;
export declare const DSH_SKILLS: Record<string, string>;
export declare const CURSOR_SKILLS: Record<string, string>;
export declare const CURSOR_COMMANDS: Record<string, string>;
export declare function specAuthoringSkill(): string;
export declare function writeAgentInstructionFile(filePath: string, section: string): void;
export declare function codexInstructions(): string;
export declare function geminiInstructions(): string;
export declare function poolsideInstructions(): string;
export declare function vibeInstructions(): string;
export declare function qwenInstructions(): string;
export declare function kimiInstructions(): string;
export declare function dshInstructions(): string;
