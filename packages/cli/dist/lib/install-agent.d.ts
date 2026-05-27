export type Agent = 'claude' | 'cursor';
export declare const SUPPORTED_AGENTS: readonly Agent[];
export declare function promptAgentSelection(projectRoot: string): Promise<string[]>;
export declare function installAgentSkills(agent: Agent, projectRoot: string): void;
export declare const CLAUDE_SKILLS: Record<string, string>;
export declare const CLAUDE_COMMANDS: Record<string, string>;
export declare const CURSOR_SKILLS: Record<string, string>;
export declare const CURSOR_COMMANDS: Record<string, string>;
