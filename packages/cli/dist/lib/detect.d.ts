export declare function detectOpenSpec(projectRoot: string): {
    detected: boolean;
    changesDir: string | null;
};
export declare function detectGraphify(projectRoot: string): {
    detected: boolean;
    graphDir: string | null;
};
export declare function readAgentsFromConfig(projectRoot: string): string[] | null;
export declare function writeAgentsToConfig(agents: string[], projectRoot: string): void;
