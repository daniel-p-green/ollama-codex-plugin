#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const pluginCwd = process.env.PLUGIN_CWD || "plugins/ollama-codex";
const outputPath = process.env.OUTPUT || join(tmpdir(), "ollama-codex-widget-proof.html");

const manifest = readJson(join(pluginCwd, ".codex-plugin", "plugin.json"));
const html = readFileSync(join(pluginCwd, "mcp", "widget-assets", "control-panel", "widget.html"), "utf8");
const css = readFileSync(join(pluginCwd, "mcp", "widget-assets", "control-panel", "widget.css"), "utf8");
const js = readFileSync(join(pluginCwd, "mcp", "widget-assets", "control-panel", "widget.js"), "utf8");
const logo = readFileSync(join(pluginCwd, "assets", "logo.svg"), "utf8");

const widgetData = {
  version: 1,
  packageVersion: manifest.version,
  supportsNativeCodexSwitch: true,
  widget: "ollama-codex-control-panel",
  selectedModel: "gpt-oss:20b",
  status: {
    currentCodexModel: "gpt-5.5",
    currentCodexProvider: "openai",
    currentUsesOllama: false,
    appConfigured: true,
    appModel: "gpt-oss:20b",
    ollamaVersion: "0.30.8",
    serverReachable: true,
    codexVersion: "codex-cli 0.137.0",
    codexInstalled: true,
    cliProfileConfigured: false,
  },
  codexModels: {
    models: [
      {
        name: "gpt-5.5",
        displayName: "GPT-5.5",
        description: "Frontier model for complex coding, research, and real-world work.",
        defaultReasoningLevel: "medium",
      },
      {
        name: "gpt-5.4",
        displayName: "GPT-5.4",
        description: "Strong model for everyday coding.",
        defaultReasoningLevel: "medium",
      },
      {
        name: "gpt-5.4-mini",
        displayName: "GPT-5.4-Mini",
        description: "Small, fast, and cost-efficient model for simpler coding tasks.",
        defaultReasoningLevel: "medium",
      },
    ],
  },
  recommendations: {
    models: [
      {
        name: "gpt-oss:20b",
        description: "Recommended local coding model",
        contextLength: 131072,
      },
      {
        name: "kimi-k2.6:cloud",
        description: "State-of-the-art coding and long-horizon execution",
        requiredPlan: "pro",
        contextLength: 262144,
      },
    ],
  },
  models: {
    models: [
      {
        name: "gpt-oss:20b",
        id: "local-gpt-oss",
        size: "13 GB",
      },
      {
        name: "gemma4:latest",
        id: "local-gemma4",
        size: "9.6 GB",
      },
    ],
  },
};

const dataScript = [
  "<script>",
  "window.openai={toolResponseMetadata:{widgetData:",
  JSON.stringify(widgetData),
  "}};",
  "window.ollamaCodexMcp={notifyResize(){},callServerTool(){return Promise.reject(new Error('Proof fixture is read-only.'));}};",
  "</script>",
].join("");

const rendered = html
  .replace("/* __OLLAMA_CODEX_WIDGET_CSS__ */", css)
  .replace("/* __OLLAMA_CODEX_WIDGET_JS__ */", js.replace("__OLLAMA_CODEX_LOGO_DATA_URI__", svgDataUri(logo)))
  .replace("</head>", '<link rel="icon" href="data:,">\n</head>')
  .replace("</head>", `${dataScript}\n</head>`);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, rendered);
console.log(outputPath);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function svgDataUri(source) {
  return `data:image/svg+xml;base64,${Buffer.from(source).toString("base64")}`;
}
