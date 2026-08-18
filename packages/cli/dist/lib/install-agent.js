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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURSOR_COMMANDS = exports.CURSOR_SKILLS = exports.KIMI_SKILLS = exports.QWEN_SKILLS = exports.VIBE_SKILLS = exports.POOLSIDE_SKILLS = exports.CLAUDE_COMMANDS = exports.CLAUDE_SKILLS = exports.OPRIM_CONTEXT_SKILL_STEP = exports.SUPPORTED_AGENTS = void 0;
exports.promptFrameworkSelection = promptFrameworkSelection;
exports.resolveSpecFramework = resolveSpecFramework;
exports.promptAgentSelection = promptAgentSelection;
exports.promptPdrSurfacing = promptPdrSurfacing;
exports.promptOkfFrontmatter = promptOkfFrontmatter;
exports.installAgentSkills = installAgentSkills;
exports.specAuthoringSkill = specAuthoringSkill;
exports.writeAgentInstructionFile = writeAgentInstructionFile;
exports.codexInstructions = codexInstructions;
exports.geminiInstructions = geminiInstructions;
exports.poolsideInstructions = poolsideInstructions;
exports.vibeInstructions = vibeInstructions;
exports.qwenInstructions = qwenInstructions;
exports.kimiInstructions = kimiInstructions;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const scaffold_1 = require("./scaffold");
const detect_1 = require("./detect");
const config_merge_1 = require("./config-merge");
const workflow_schema_1 = require("./workflow-schema");
const workflow_renderer_1 = require("./workflow-renderer");
exports.SUPPORTED_AGENTS = [
    'claude',
    'cursor',
    'codex',
    'gemini',
    'poolside',
    'vibe',
    'qwen',
    'kimi',
];
// oprim/config.yaml (via integrations.spec_framework) is the source of truth for the
// selected speccing framework; .claude/hooks/config.json is checked only as a fallback for
// projects that installed before that key existed.
function readPersistedFramework(projectRoot) {
    const configYamlPath = path.join(projectRoot, 'oprim', 'config.yaml');
    if (fs.existsSync(configYamlPath)) {
        const persisted = (0, config_merge_1.readSpecFramework)(fs.readFileSync(configYamlPath, 'utf-8'));
        if (persisted)
            return persisted;
    }
    const hooksConfigPath = path.join(projectRoot, '.claude', 'hooks', 'config.json');
    if (fs.existsSync(hooksConfigPath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf-8'));
            if (typeof existing.framework === 'string')
                return existing.framework;
        }
        catch {
            // fallthrough
        }
    }
    return null;
}
async function promptFrameworkSelection(projectRoot) {
    const persisted = readPersistedFramework(projectRoot);
    if (persisted) {
        console.log(chalk_1.default.dim(`  Speccing framework: ${persisted} (from config)`));
        return persisted;
    }
    const { select } = await Promise.resolve().then(() => __importStar(require('@inquirer/prompts')));
    return select({
        message: 'Which speccing framework does this project use?',
        choices: [
            { name: 'Native (oprim-authored specs, recommended)', value: 'native' },
            { name: 'OpenSpec', value: 'openspec' },
            { name: 'None', value: 'none' },
        ],
    });
}
// No-prompt resolution used where an interactive choice isn't appropriate (e.g. non-Claude
// agent branches): the persisted value if one exists, else a default derived from the
// project's existing openspec state.
function resolveSpecFramework(projectRoot) {
    const persisted = readPersistedFramework(projectRoot);
    if (persisted)
        return persisted;
    const configYamlPath = path.join(projectRoot, 'oprim', 'config.yaml');
    if (fs.existsSync(configYamlPath)) {
        return (0, config_merge_1.deriveDefaultSpecFramework)(fs.readFileSync(configYamlPath, 'utf-8'));
    }
    return 'none';
}
async function promptAgentSelection(projectRoot) {
    const detected = (0, detect_1.detectAvailableAgents)(projectRoot);
    if (detected.length > 0) {
        console.log(chalk_1.default.dim(`Auto-detected AI tool environments: ${detected.join(', ')}`));
    }
    console.log('');
    const { checkbox } = await Promise.resolve().then(() => __importStar(require('@inquirer/prompts')));
    return checkbox({
        message: 'Which AI tools should /oprim:* skills be installed for?',
        choices: [
            { name: 'Claude Code', value: 'claude', checked: detected.includes('claude') },
            { name: 'Cursor', value: 'cursor', checked: detected.includes('cursor') },
            { name: 'Codex', value: 'codex', checked: detected.includes('codex') },
            { name: 'Gemini CLI', value: 'gemini', checked: detected.includes('gemini') },
            { name: 'Poolside', value: 'poolside', checked: detected.includes('poolside') },
            { name: 'Mistral Vibe', value: 'vibe', checked: detected.includes('vibe') },
            { name: 'Qwen Code', value: 'qwen', checked: detected.includes('qwen') },
            { name: 'Kimi CLI', value: 'kimi', checked: detected.includes('kimi') },
        ],
    });
}
async function promptPdrSurfacing() {
    const { confirm } = await Promise.resolve().then(() => __importStar(require('@inquirer/prompts')));
    return confirm({ message: 'Enable proactive PDR surfacing in skills? (Y/n)', default: true });
}
async function promptOkfFrontmatter() {
    const { confirm } = await Promise.resolve().then(() => __importStar(require('@inquirer/prompts')));
    return confirm({
        message: 'Enable OKF (Open Knowledge Format) frontmatter on scaffolded artifacts? (y/N)',
        default: false,
    });
}
// Workflow ids installed as Claude/Poolside/Cursor skill files — see packages/cli/src/workflows/.
// Order matches the pre-refactor CLAUDE_SKILLS/POOLSIDE_SKILLS/CURSOR_SKILLS declaration order.
const CLAUDE_SKILL_WORKFLOW_IDS = ['pdr', 'bet', 'note', 'criteria', 'review', 'archive', 'sequence', 'context', 'explore', 'reconcile'];
const POOLSIDE_SKILL_WORKFLOW_IDS = ['pdr', 'bet', 'note', 'criteria', 'review', 'archive', 'sequence', 'explore', 'reconcile'];
const CURSOR_SKILL_WORKFLOW_IDS = ['pdr', 'bet', 'note', 'criteria', 'review'];
// Claude command wrappers (thin, invoke skill) — filename -> workflow id. Order matches the
// pre-refactor CLAUDE_COMMANDS declaration order.
const CLAUDE_COMMAND_WORKFLOWS = [
    { filename: 'promote.md', id: 'promote' },
    { filename: 'sequence.md', id: 'sequence' },
    { filename: 'archive.md', id: 'archive' },
    { filename: 'context-init.md', id: 'context' },
    { filename: 'explore.md', id: 'explore' },
    { filename: 'reconcile.md', id: 'reconcile' },
];
// Cursor command files (full inline). Order matches the pre-refactor CURSOR_COMMANDS declaration order.
const CURSOR_COMMAND_WORKFLOW_IDS = ['promote', 'sequence', 'pdr', 'bet', 'note', 'criteria', 'review'];
function installAgentSkills(agent, projectRoot, framework = 'openspec', pdrSurfacing = false) {
    if (agent === 'claude') {
        const claudeDir = path.join(projectRoot, '.claude');
        const dirCreated = !fs.existsSync(claudeDir);
        const skillsBase = path.join(claudeDir, 'skills');
        // oprim:context skill — install when opted in, remove when opted out
        const contextSkillPath = path.join(skillsBase, 'oprim:context', 'SKILL.md');
        if (pdrSurfacing) {
            (0, scaffold_1.writeFile)(contextSkillPath, oprimContextSkill());
            console.log(chalk_1.default.green('✓') + ' .claude/skills/oprim:context/SKILL.md');
        }
        else if (fs.existsSync(contextSkillPath)) {
            fs.unlinkSync(contextSkillPath);
            try {
                fs.rmdirSync(path.dirname(contextSkillPath));
            }
            catch { /* not empty or already gone */ }
            console.log(chalk_1.default.dim('  removed .claude/skills/oprim:context/SKILL.md'));
        }
        // oprim skills — prepend Step 0 when opted in
        for (const id of CLAUDE_SKILL_WORKFLOW_IDS) {
            const schema = (0, workflow_schema_1.loadWorkflowSchema)(id, projectRoot);
            if (!schema.claude.skill || !schema.skillName)
                continue;
            const body = (0, workflow_renderer_1.renderSkillBody)(id, projectRoot);
            const skillContent = pdrSurfacing ? withContextStep(body) : body;
            (0, scaffold_1.writeFile)(path.join(skillsBase, schema.skillName, 'SKILL.md'), skillContent);
            console.log(chalk_1.default.green('✓') + ` .claude/skills/${schema.skillName}/SKILL.md`);
        }
        // oprim-spec (native spec authoring) — install only when spec_framework is native, remove otherwise
        const specSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
        if (framework === 'native') {
            const specBody = (0, workflow_renderer_1.renderSkillBody)('spec-authoring', projectRoot);
            const specSkillContent = pdrSurfacing ? withContextStep(specBody) : specBody;
            (0, scaffold_1.writeFile)(specSkillPath, specSkillContent);
            console.log(chalk_1.default.green('✓') + ' .claude/skills/oprim-spec/SKILL.md');
        }
        else if (fs.existsSync(specSkillPath)) {
            fs.unlinkSync(specSkillPath);
            try {
                fs.rmdirSync(path.dirname(specSkillPath));
            }
            catch { /* not empty or already gone */ }
            console.log(chalk_1.default.dim('  removed .claude/skills/oprim-spec/SKILL.md'));
        }
        // openspec skills — add/remove Step 0 in-place when they exist
        for (const name of OPENSPEC_SKILL_NAMES) {
            const skillFilePath = path.join(skillsBase, name, 'SKILL.md');
            if (fs.existsSync(skillFilePath)) {
                const current = fs.readFileSync(skillFilePath, 'utf-8');
                const updated = pdrSurfacing ? addContextStepToFile(current) : removeContextStepFromFile(current);
                if (updated !== current) {
                    fs.writeFileSync(skillFilePath, updated, 'utf-8');
                    console.log(chalk_1.default.green('✓') +
                        ` .claude/skills/${name}/SKILL.md (PDR surfacing ${pdrSurfacing ? 'enabled' : 'disabled'})`);
                }
            }
        }
        const cmdsDir = path.join(claudeDir, 'commands', 'oprim');
        for (const { filename, id } of CLAUDE_COMMAND_WORKFLOWS) {
            const content = (0, workflow_renderer_1.renderClaudeCommand)(id, projectRoot, framework);
            (0, scaffold_1.writeFile)(path.join(cmdsDir, filename), content);
            console.log(chalk_1.default.green('✓') + ` .claude/commands/oprim/${filename}`);
        }
        // Tombstone cleanup: remove command wrappers deleted in v0.2.0 (bet/criteria/pdr/review
        // became skills-only). Safe to remove this block once the user base has migrated past v0.2.0.
        const tombstones = ['bet.md', 'criteria.md', 'pdr.md', 'review.md'];
        for (const filename of tombstones) {
            const filepath = path.join(cmdsDir, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(chalk_1.default.dim(`  removed legacy command .claude/commands/oprim/${filename}`));
            }
        }
        // Tombstone: remove legacy on-skill-archive.sh (replaced by on-prompt-submit + on-stop in v0.x)
        const legacyHookPath = path.join(claudeDir, 'hooks', 'on-skill-archive.sh');
        if (fs.existsSync(legacyHookPath)) {
            fs.unlinkSync(legacyHookPath);
            console.log(chalk_1.default.dim('  removed legacy hook .claude/hooks/on-skill-archive.sh'));
        }
        // Hooks: UserPromptSubmit + Stop for co-archival coordination
        const hooksDir = path.join(claudeDir, 'hooks');
        (0, scaffold_1.writeFile)(path.join(hooksDir, 'config.json'), hooksConfig(framework));
        console.log(chalk_1.default.green('✓') + ' .claude/hooks/config.json');
        const promptSubmitPath = path.join(hooksDir, 'on-prompt-submit.sh');
        (0, scaffold_1.writeFile)(promptSubmitPath, ON_PROMPT_SUBMIT_HOOK);
        fs.chmodSync(promptSubmitPath, 0o755);
        console.log(chalk_1.default.green('✓') + ' .claude/hooks/on-prompt-submit.sh');
        const stopHookPath = path.join(hooksDir, 'on-stop.sh');
        (0, scaffold_1.writeFile)(stopHookPath, ON_STOP_HOOK);
        fs.chmodSync(stopHookPath, 0o755);
        console.log(chalk_1.default.green('✓') + ' .claude/hooks/on-stop.sh');
        mergeClaudeSettingsHooks(claudeDir);
        if (dirCreated) {
            console.log(chalk_1.default.dim('  .claude/ created — Claude Code will discover these files automatically.'));
        }
    }
    else if (agent === 'poolside') {
        const poolsideDir = path.join(projectRoot, '.poolside');
        const dirCreated = !fs.existsSync(poolsideDir);
        const skillsBase = path.join(poolsideDir, 'skills');
        for (const id of POOLSIDE_SKILL_WORKFLOW_IDS) {
            const schema = (0, workflow_schema_1.loadWorkflowSchema)(id, projectRoot);
            if (!schema.poolside.skill || !schema.skillName)
                continue;
            (0, scaffold_1.writeFile)(path.join(skillsBase, schema.skillName, 'SKILL.md'), (0, workflow_renderer_1.renderSkillBody)(id, projectRoot));
            console.log(chalk_1.default.green('✓') + ` .poolside/skills/${schema.skillName}/SKILL.md`);
        }
        const poolsideSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
        if (framework === 'native') {
            (0, scaffold_1.writeFile)(poolsideSpecSkillPath, (0, workflow_renderer_1.renderSkillBody)('spec-authoring', projectRoot));
            console.log(chalk_1.default.green('✓') + ' .poolside/skills/oprim-spec/SKILL.md');
        }
        else if (fs.existsSync(poolsideSpecSkillPath)) {
            fs.unlinkSync(poolsideSpecSkillPath);
            try {
                fs.rmdirSync(path.dirname(poolsideSpecSkillPath));
            }
            catch { /* not empty or already gone */ }
            console.log(chalk_1.default.dim('  removed .poolside/skills/oprim-spec/SKILL.md'));
        }
        const agentsFile = path.join(projectRoot, 'AGENTS.md');
        writeAgentInstructionFile(agentsFile, poolsideInstructions());
        console.log(chalk_1.default.green('✓') + ' AGENTS.md (oprim section written)');
        if (dirCreated) {
            console.log(chalk_1.default.dim('  .poolside/ created — Poolside will discover these files automatically.'));
        }
    }
    else if (agent === 'vibe') {
        const vibeDir = path.join(projectRoot, '.vibe');
        const dirCreated = !fs.existsSync(vibeDir);
        const skillsBase = path.join(vibeDir, 'skills');
        for (const id of POOLSIDE_SKILL_WORKFLOW_IDS) {
            const schema = (0, workflow_schema_1.loadWorkflowSchema)(id, projectRoot);
            if (!schema.vibe.skill || !schema.skillName)
                continue;
            (0, scaffold_1.writeFile)(path.join(skillsBase, schema.skillName, 'SKILL.md'), (0, workflow_renderer_1.renderSkillBody)(id, projectRoot));
            console.log(chalk_1.default.green('✓') + ` .vibe/skills/${schema.skillName}/SKILL.md`);
        }
        const vibeSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
        if (framework === 'native') {
            (0, scaffold_1.writeFile)(vibeSpecSkillPath, (0, workflow_renderer_1.renderSkillBody)('spec-authoring', projectRoot));
            console.log(chalk_1.default.green('✓') + ' .vibe/skills/oprim-spec/SKILL.md');
        }
        else if (fs.existsSync(vibeSpecSkillPath)) {
            fs.unlinkSync(vibeSpecSkillPath);
            try {
                fs.rmdirSync(path.dirname(vibeSpecSkillPath));
            }
            catch { /* not empty or already gone */ }
            console.log(chalk_1.default.dim('  removed .vibe/skills/oprim-spec/SKILL.md'));
        }
        const agentsFile = path.join(projectRoot, 'AGENTS.md');
        writeAgentInstructionFile(agentsFile, vibeInstructions());
        console.log(chalk_1.default.green('✓') + ' AGENTS.md (oprim section written)');
        if (dirCreated) {
            console.log(chalk_1.default.dim('  .vibe/ created — Mistral Vibe will discover these files automatically.'));
        }
    }
    else if (agent === 'qwen') {
        const qwenDir = path.join(projectRoot, '.qwen');
        const dirCreated = !fs.existsSync(qwenDir);
        const skillsBase = path.join(qwenDir, 'skills');
        for (const id of POOLSIDE_SKILL_WORKFLOW_IDS) {
            const schema = (0, workflow_schema_1.loadWorkflowSchema)(id, projectRoot);
            if (!schema.qwen.skill || !schema.skillName)
                continue;
            (0, scaffold_1.writeFile)(path.join(skillsBase, schema.skillName, 'SKILL.md'), (0, workflow_renderer_1.renderSkillBody)(id, projectRoot));
            console.log(chalk_1.default.green('✓') + ` .qwen/skills/${schema.skillName}/SKILL.md`);
        }
        const qwenSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
        if (framework === 'native') {
            (0, scaffold_1.writeFile)(qwenSpecSkillPath, (0, workflow_renderer_1.renderSkillBody)('spec-authoring', projectRoot));
            console.log(chalk_1.default.green('✓') + ' .qwen/skills/oprim-spec/SKILL.md');
        }
        else if (fs.existsSync(qwenSpecSkillPath)) {
            fs.unlinkSync(qwenSpecSkillPath);
            try {
                fs.rmdirSync(path.dirname(qwenSpecSkillPath));
            }
            catch { /* not empty or already gone */ }
            console.log(chalk_1.default.dim('  removed .qwen/skills/oprim-spec/SKILL.md'));
        }
        const agentsFile = path.join(projectRoot, 'AGENTS.md');
        writeAgentInstructionFile(agentsFile, qwenInstructions());
        console.log(chalk_1.default.green('✓') + ' AGENTS.md (oprim section written)');
        if (dirCreated) {
            console.log(chalk_1.default.dim('  .qwen/ created — Qwen Code will discover these files automatically.'));
        }
    }
    else if (agent === 'kimi') {
        // Kimi CLI is a split-path install: .kimi/ is the detection signal, but skills are
        // discovered from a project-root .skills/ directory, not .kimi/skills/ — see
        // kimi-cli-agent-support spec.
        const kimiDir = path.join(projectRoot, '.kimi');
        const kimiDirCreated = !fs.existsSync(kimiDir);
        if (kimiDirCreated) {
            fs.mkdirSync(kimiDir, { recursive: true });
        }
        const skillsBase = path.join(projectRoot, '.skills');
        const skillsDirCreated = !fs.existsSync(skillsBase);
        for (const id of POOLSIDE_SKILL_WORKFLOW_IDS) {
            const schema = (0, workflow_schema_1.loadWorkflowSchema)(id, projectRoot);
            if (!schema.kimi.skill || !schema.skillName)
                continue;
            (0, scaffold_1.writeFile)(path.join(skillsBase, schema.skillName, 'SKILL.md'), (0, workflow_renderer_1.renderSkillBody)(id, projectRoot));
            console.log(chalk_1.default.green('✓') + ` .skills/${schema.skillName}/SKILL.md`);
        }
        const kimiSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
        if (framework === 'native') {
            (0, scaffold_1.writeFile)(kimiSpecSkillPath, (0, workflow_renderer_1.renderSkillBody)('spec-authoring', projectRoot));
            console.log(chalk_1.default.green('✓') + ' .skills/oprim-spec/SKILL.md');
        }
        else if (fs.existsSync(kimiSpecSkillPath)) {
            fs.unlinkSync(kimiSpecSkillPath);
            try {
                fs.rmdirSync(path.dirname(kimiSpecSkillPath));
            }
            catch { /* not empty or already gone */ }
            console.log(chalk_1.default.dim('  removed .skills/oprim-spec/SKILL.md'));
        }
        const agentsFile = path.join(projectRoot, 'AGENTS.md');
        writeAgentInstructionFile(agentsFile, kimiInstructions());
        console.log(chalk_1.default.green('✓') + ' AGENTS.md (oprim section written)');
        if (kimiDirCreated) {
            console.log(chalk_1.default.dim('  .kimi/ created — Kimi CLI will discover this directory automatically.'));
        }
        if (skillsDirCreated) {
            console.log(chalk_1.default.dim('  .skills/ created — Kimi CLI will discover these files automatically.'));
        }
    }
    else if (agent === 'codex') {
        const agentsFile = path.join(projectRoot, 'AGENTS.md');
        writeAgentInstructionFile(agentsFile, codexInstructions());
        console.log(chalk_1.default.green('✓') + ' AGENTS.md (oprim section written)');
    }
    else if (agent === 'gemini') {
        const geminiFile = path.join(projectRoot, 'GEMINI.md');
        writeAgentInstructionFile(geminiFile, geminiInstructions());
        console.log(chalk_1.default.green('✓') + ' GEMINI.md (oprim section written)');
    }
    else if (agent === 'cursor') {
        const cursorDir = path.join(projectRoot, '.cursor');
        const dirCreated = !fs.existsSync(cursorDir);
        const skillsBase = path.join(cursorDir, 'skills');
        for (const id of CURSOR_SKILL_WORKFLOW_IDS) {
            const schema = (0, workflow_schema_1.loadWorkflowSchema)(id, projectRoot);
            if (!schema.cursor.skill || !schema.skillName)
                continue;
            (0, scaffold_1.writeFile)(path.join(skillsBase, schema.skillName, 'SKILL.md'), (0, workflow_renderer_1.renderSkillBody)(id, projectRoot));
            console.log(chalk_1.default.green('✓') + ` .cursor/skills/${schema.skillName}/SKILL.md`);
        }
        const cursorSpecSkillPath = path.join(skillsBase, 'oprim-spec', 'SKILL.md');
        if (framework === 'native') {
            (0, scaffold_1.writeFile)(cursorSpecSkillPath, (0, workflow_renderer_1.renderSkillBody)('spec-authoring', projectRoot));
            console.log(chalk_1.default.green('✓') + ' .cursor/skills/oprim-spec/SKILL.md');
        }
        else if (fs.existsSync(cursorSpecSkillPath)) {
            fs.unlinkSync(cursorSpecSkillPath);
            try {
                fs.rmdirSync(path.dirname(cursorSpecSkillPath));
            }
            catch { /* not empty or already gone */ }
            console.log(chalk_1.default.dim('  removed .cursor/skills/oprim-spec/SKILL.md'));
        }
        const cmdsDir = path.join(cursorDir, 'commands');
        for (const id of CURSOR_COMMAND_WORKFLOW_IDS) {
            const schema = (0, workflow_schema_1.loadWorkflowSchema)(id, projectRoot);
            if (!schema.cursor.command)
                continue;
            const content = (0, workflow_renderer_1.renderCursorCommand)(id, projectRoot, framework);
            (0, scaffold_1.writeFile)(path.join(cmdsDir, schema.cursor.command), content);
            console.log(chalk_1.default.green('✓') + ` .cursor/commands/${schema.cursor.command}`);
        }
        if (dirCreated) {
            console.log(chalk_1.default.dim('  .cursor/ created — Cursor will discover these files automatically.'));
        }
    }
}
// ─── PDR context surfacing ────────────────────────────────────────────────────
const CTX_STEP_START = '<!-- oprim:context:start -->';
const CTX_STEP_END = '<!-- oprim:context:end -->';
exports.OPRIM_CONTEXT_SKILL_STEP = `## Step 0: Check relevant product decisions
Invoke the \`oprim:context\` skill using the Skill tool. If matching PDRs are surfaced, review them before proceeding. If no PDRs match or \`oprim/decisions/\` is empty, the skill exits silently — continue to Step 1 immediately.`;
// Openspec skill names whose files are managed by the openspec CLI and modified in-place by oprim
const OPENSPEC_SKILL_NAMES = [
    'openspec-propose',
    'openspec-apply-change',
    'openspec-explore',
    'openspec-archive-change',
];
// Insert Step 0 into an oprim skill string (written fresh each time — no markers needed)
function withContextStep(content) {
    const lines = content.split('\n');
    let closingDash = -1;
    let dashCount = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
            dashCount++;
            if (dashCount === 2) {
                closingDash = i;
                break;
            }
        }
    }
    if (closingDash === -1)
        return exports.OPRIM_CONTEXT_SKILL_STEP + '\n\n' + content;
    const front = lines.slice(0, closingDash + 1).join('\n');
    const body = lines.slice(closingDash + 1).join('\n').trimStart();
    return `${front}\n\n${exports.OPRIM_CONTEXT_SKILL_STEP}\n\n${body}`;
}
// Idempotently add Step 0 to an openspec skill file (read-modify-write)
function addContextStepToFile(content) {
    if (content.includes(CTX_STEP_START))
        return content; // already present
    const lines = content.split('\n');
    let closingDash = -1;
    let dashCount = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
            dashCount++;
            if (dashCount === 2) {
                closingDash = i;
                break;
            }
        }
    }
    const block = `${CTX_STEP_START}\n${exports.OPRIM_CONTEXT_SKILL_STEP}\n${CTX_STEP_END}`;
    if (closingDash === -1)
        return block + '\n\n' + content;
    const front = lines.slice(0, closingDash + 1).join('\n');
    const body = lines.slice(closingDash + 1).join('\n').trimStart();
    return `${front}\n\n${block}\n\n${body}`;
}
// Remove Step 0 block from an openspec skill file (read-modify-write)
function removeContextStepFromFile(content) {
    const s = content.indexOf(CTX_STEP_START);
    if (s === -1)
        return content;
    const e = content.indexOf(CTX_STEP_END, s);
    if (e === -1)
        return content;
    const before = content.slice(0, s).trimEnd();
    const after = content.slice(e + CTX_STEP_END.length).replace(/^\n+/, '\n');
    return before + after;
}
// The oprim:context skill (PDR-surfacing lookup) is install-time plumbing tied to the
// pdrSurfacing toggle, not a forkable workflow artifact — it stays a small literal here
// rather than moving into the declarative workflow-schema system.
function oprimContextSkill() {
    return `---
name: oprim:context
description: Surface relevant product decisions from oprim/decisions/ by keyword-matching against the current conversation — invoke at the start of any oprim or openspec workflow when PDR surfacing is enabled
---

Scan \`oprim/decisions/\` and surface PDRs that match keywords from the current conversation.

## Steps

### 1. Check for decisions
Scan \`oprim/decisions/\` for files matching \`PDR-*.md\`. If the directory is empty or contains no PDR files, exit silently — produce no output and return immediately.

### 2. Extract keywords
From the current conversation context, extract 3–10 topic keywords: bet IDs referenced (e.g. \`BET-007\`), capability names, filenames mentioned, subject-area nouns. Focus on the most specific and distinctive terms.

### 3. Match PDRs
For each PDR file: read the filename and the first 25 lines (to capture title, status, and context). A PDR is relevant if any keyword appears in the filename, title (\`# PDR-NNN: ...\`), or body text (case-insensitive).

### 4. Report or exit silently
If one or more PDRs match:

**Relevant product decisions:**
- PDR-NNN: <title> — <Status> (\`oprim/decisions/PDR-NNN-<slug>.md\`)

List each match on its own line, then return — the invoking skill continues to its next step.

If no PDRs match: exit silently — produce no output.
`;
}
// ─── Bundled skill/command exports (bundled defaults, no project overrides — used by tests
// and oprim doctor's skill-drift check; installAgentSkills() itself resolves overrides
// per-project via workflow-schema.ts/workflow-renderer.ts) ────────────────────────────────
exports.CLAUDE_SKILLS = Object.fromEntries(CLAUDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = (0, workflow_schema_1.loadWorkflowSchema)(id);
    return [schema.skillName, (0, workflow_renderer_1.renderSkillBody)(id)];
}));
exports.CLAUDE_COMMANDS = Object.fromEntries(CLAUDE_COMMAND_WORKFLOWS.map(({ filename, id }) => [filename, (0, workflow_renderer_1.renderClaudeCommand)(id)]));
exports.POOLSIDE_SKILLS = Object.fromEntries(POOLSIDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = (0, workflow_schema_1.loadWorkflowSchema)(id);
    return [schema.skillName, (0, workflow_renderer_1.renderSkillBody)(id)];
}));
exports.VIBE_SKILLS = Object.fromEntries(POOLSIDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = (0, workflow_schema_1.loadWorkflowSchema)(id);
    return [schema.skillName, (0, workflow_renderer_1.renderSkillBody)(id)];
}));
exports.QWEN_SKILLS = Object.fromEntries(POOLSIDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = (0, workflow_schema_1.loadWorkflowSchema)(id);
    return [schema.skillName, (0, workflow_renderer_1.renderSkillBody)(id)];
}));
exports.KIMI_SKILLS = Object.fromEntries(POOLSIDE_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = (0, workflow_schema_1.loadWorkflowSchema)(id);
    return [schema.skillName, (0, workflow_renderer_1.renderSkillBody)(id)];
}));
exports.CURSOR_SKILLS = Object.fromEntries(CURSOR_SKILL_WORKFLOW_IDS.map((id) => {
    const schema = (0, workflow_schema_1.loadWorkflowSchema)(id);
    return [schema.skillName, (0, workflow_renderer_1.renderSkillBody)(id)];
}));
exports.CURSOR_COMMANDS = Object.fromEntries(CURSOR_COMMAND_WORKFLOW_IDS.map((id) => {
    const schema = (0, workflow_schema_1.loadWorkflowSchema)(id);
    return [schema.cursor.command, (0, workflow_renderer_1.renderCursorCommand)(id)];
}));
function specAuthoringSkill() {
    return (0, workflow_renderer_1.renderSkillBody)('spec-authoring');
}
// ─── Hook scripts: co-archival coordination ──────────────────────────────────
function hooksConfig(framework) {
    return (JSON.stringify({
        framework,
        archive_commands: framework === 'openspec' ? ['/opsx:archive', '/openspec-archive-change'] : [],
    }, null, 2) + '\n');
}
const ON_PROMPT_SUBMIT_HOOK = `#!/usr/bin/env bash
# UserPromptSubmit hook: detects lifecycle slash commands and sets pending flags.

archive_flag=".claude/hooks/.archive-pending"
nudge_flag=".claude/hooks/.sequence-nudge"

input=$(cat)

# Archive co-archival detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*(opsx:archive|openspec-archive-change)'; then
  prompt=$(printf '%s' "$input" | grep -oE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"//;s/"$//')
  arg=$(printf '%s' "$prompt" | sed 's|^[[:space:]]*/[^[:space:]]* *||' | awk '{print $1}' | sed 's|^@||' | sed 's|.*/changes/||' | sed 's|/$||' | xargs 2>/dev/null || true)
  printf '%s' "$arg" > "$archive_flag"
fi

# Bet creation detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*oprim:bet'; then
  printf 'bet-created' > "$nudge_flag"
fi

# Bet promotion detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*oprim:promote'; then
  printf 'bet-promoted' > "$nudge_flag"
fi
`;
const ON_STOP_HOOK = `#!/usr/bin/env bash
# Stop hook: archive co-archival coordination and sequencing nudges.

archive_flag=".claude/hooks/.archive-pending"
nudge_flag=".claude/hooks/.sequence-nudge"

# --- Archive co-archival block ---
if [ -f "$archive_flag" ]; then
  change=$(tr -d '[:space:]' < "$archive_flag")

  if [ -z "$change" ]; then
    latest=$(ls openspec/changes/archive/ 2>/dev/null | sort -r | head -1)
    [ -n "$latest" ] && change=$(echo "$latest" | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
  fi

  if [ -n "$change" ]; then
    archive_dir=$(ls openspec/changes/archive/ 2>/dev/null | grep -F "$change" | sort -r | head -1)
    if [ -n "$archive_dir" ]; then
      rm -f "$archive_flag"
      proposal="openspec/changes/archive/$archive_dir/proposal.md"
      if [ -f "$proposal" ]; then
        bet_id=$(grep -oE 'BET-[0-9]+' "$proposal" | head -1)
        if [ -n "$bet_id" ]; then
          printf '{"decision":"block","reason":"The openspec change '''%s''' was just archived. Its proposal.md references %s. Please invoke \`/oprim:archive %s\` to co-archive the linked bet."}\\n' "$change" "$bet_id" "$bet_id"
          exit 0
        fi
      fi
    fi
  fi
fi

# --- Sequencing nudge from lifecycle event ---
if [ -f "$nudge_flag" ]; then
  context=$(cat "$nudge_flag")
  rm -f "$nudge_flag"

  case "$context" in
    bet-created)
      printf '\\n💡 A new bet was added to your backlog. Run \`/oprim:sequence\` to check if it should be pulled into Now or Next.\\n'
      ;;
    bet-promoted)
      printf '\\n💡 A bet was promoted to an OpenSpec change. Run \`/oprim:sequence\` to verify the board reflects this.\\n'
      ;;
  esac
fi

# --- Open Now slot check ---
if [ -f "oprim/sequence.yaml" ]; then
  wip_limit=$(awk '/^wip_limits:/{in_wip=1} in_wip && /^  now:/{print $2; exit} /^[^ ]/{in_wip=0}' oprim/sequence.yaml 2>/dev/null)
  now_count=$(awk '/^now:/{in_now=1; next} in_now && /^[^ ]/{in_now=0} in_now && /^  - id:/{count++} END{print count+0}' oprim/sequence.yaml 2>/dev/null)
  next_count=$(awk '/^next:/{in_next=1; next} in_next && /^[^ ]/{in_next=0} in_next && /^  - id:/{count++} END{print count+0}' oprim/sequence.yaml 2>/dev/null)

  if [ -n "$wip_limit" ] && [ -n "$now_count" ] && [ -n "$next_count" ]; then
    if [ "$now_count" -lt "$wip_limit" ] 2>/dev/null && [ "$next_count" -gt 0 ] 2>/dev/null; then
      printf '\\n💡 Now lane has capacity (%s/%s). Run \`/oprim:sequence\` to pull something from Next.\\n' "$now_count" "$wip_limit"
    fi
  fi
fi
`;
// Merge UserPromptSubmit + Stop hooks into .claude/settings.json without clobbering existing entries.
// Also removes the legacy PostToolUse/Skill hook from on-skill-archive.sh if present.
function mergeClaudeSettingsHooks(claudeDir) {
    const settingsPath = path.join(claudeDir, 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsPath)) {
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        }
        catch {
            // Unreadable settings — start from scratch
        }
    }
    if (!settings.hooks)
        settings.hooks = {};
    const hooks = settings.hooks;
    // Tombstone: remove legacy PostToolUse/Skill entry from on-skill-archive.sh
    const legacyCommand = 'bash ".claude/hooks/on-skill-archive.sh"';
    if (hooks.PostToolUse) {
        const postToolUse = hooks.PostToolUse;
        const filtered = postToolUse.filter((entry) => {
            const entryHooks = entry.hooks;
            return !entryHooks?.some((h) => h.command === legacyCommand);
        });
        if (filtered.length === 0) {
            delete hooks.PostToolUse;
        }
        else {
            hooks.PostToolUse = filtered;
        }
    }
    // Register UserPromptSubmit hook
    const promptSubmitCommand = 'bash ".claude/hooks/on-prompt-submit.sh"';
    if (!hooks.UserPromptSubmit)
        hooks.UserPromptSubmit = [];
    const userPromptSubmit = hooks.UserPromptSubmit;
    const promptSubmitPresent = userPromptSubmit.some((entry) => {
        const entryHooks = entry.hooks;
        return entryHooks?.some((h) => h.command === promptSubmitCommand);
    });
    if (!promptSubmitPresent) {
        userPromptSubmit.push({ hooks: [{ type: 'command', command: promptSubmitCommand }] });
    }
    // Register Stop hook
    const stopCommand = 'bash ".claude/hooks/on-stop.sh"';
    if (!hooks.Stop)
        hooks.Stop = [];
    const stopHooks = hooks.Stop;
    const stopPresent = stopHooks.some((entry) => {
        const entryHooks = entry.hooks;
        return entryHooks?.some((h) => h.command === stopCommand);
    });
    if (!stopPresent) {
        stopHooks.push({ hooks: [{ type: 'command', command: stopCommand }] });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
    console.log(chalk_1.default.green('✓') + ' .claude/settings.json (UserPromptSubmit + Stop hooks registered)');
}
// ─── Instruction-file helpers (Codex / Gemini CLI) ────────────────────────────
const OPRIM_START = '<!-- oprim:start -->';
const OPRIM_END = '<!-- oprim:end -->';
function writeAgentInstructionFile(filePath, section) {
    const delimited = `${OPRIM_START}\n${section}\n${OPRIM_END}`;
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, delimited + '\n', 'utf-8');
        return;
    }
    const existing = fs.readFileSync(filePath, 'utf-8');
    const startIdx = existing.indexOf(OPRIM_START);
    const endIdx = existing.indexOf(OPRIM_END);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const before = existing.slice(0, startIdx);
        const after = existing.slice(endIdx + OPRIM_END.length);
        fs.writeFileSync(filePath, before + delimited + after, 'utf-8');
    }
    else {
        const separator = existing.endsWith('\n') ? '\n' : '\n\n';
        fs.writeFileSync(filePath, existing + separator + delimited + '\n', 'utf-8');
    }
}
function codexInstructions() {
    return (0, workflow_renderer_1.renderAgentInstructions)();
}
function geminiInstructions() {
    return (0, workflow_renderer_1.renderAgentInstructions)();
}
function poolsideInstructions() {
    return (0, workflow_renderer_1.renderAgentInstructions)();
}
function vibeInstructions() {
    return (0, workflow_renderer_1.renderAgentInstructions)();
}
function qwenInstructions() {
    return (0, workflow_renderer_1.renderAgentInstructions)();
}
function kimiInstructions() {
    return (0, workflow_renderer_1.renderAgentInstructions)();
}
