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
exports.detectOpenSpec = detectOpenSpec;
exports.detectGraphify = detectGraphify;
exports.readAgentsFromConfig = readAgentsFromConfig;
exports.writeAgentsToConfig = writeAgentsToConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
function detectOpenSpec(projectRoot) {
    const detected = fs.existsSync(path.join(projectRoot, 'openspec'));
    return { detected, changesDir: detected ? 'openspec/changes' : null };
}
function detectGraphify(projectRoot) {
    const detected = fs.existsSync(path.join(projectRoot, 'graphify-out'));
    return { detected, graphDir: detected ? 'graphify-out' : null };
}
function readAgentsFromConfig(projectRoot) {
    const configPath = path.join(projectRoot, 'primer', 'config.yaml');
    if (!fs.existsSync(configPath))
        return null;
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content);
    if (!config || !('agents' in config))
        return null;
    const agents = config['agents'];
    if (!Array.isArray(agents))
        return null;
    return agents;
}
function writeAgentsToConfig(agents, projectRoot) {
    const configPath = path.join(projectRoot, 'primer', 'config.yaml');
    if (!fs.existsSync(configPath))
        return;
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content);
    config['agents'] = agents;
    fs.writeFileSync(configPath, yaml.dump(config, { indent: 2 }), 'utf-8');
}
