#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const mcpDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = join(mcpDir, "..");
const wrapper = join(pluginRoot, "scripts", "ollama-codex.sh");
const userHome = process.env.HOME || homedir();
const codexHome = process.env.CODEX_HOME || join(userHome, ".codex");
const codexConfigPath = join(codexHome, "config.toml");
const ollamaConfigPath = join(userHome, ".ollama", "config.json");
const ollamaRecommendationsPath = join(userHome, ".ollama", "cache", "model-recommendations.json");
const WIDGET_URI = "ui://widget/ollama-codex-control-panel.html";
const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";

const manifest = JSON.parse(readFileSync(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
let cachedMcpAppsGlobalScript = "";

const server = new McpServer(
  {
    name: "ollama_codex",
    version: manifest.version,
  },
  {
    instructions:
      "Render and operate the Ollama for Codex control panel inside Codex. The widget calls local MCP tools; those tools delegate all profile mutations to the deterministic shell wrapper.",
  },
);

registerControlPanelResource();
registerTools();

const transport = new StdioServerTransport();
await server.connect(transport);

function registerControlPanelResource() {
  const html = inlineWidget({
    html: readText("mcp", "widget-assets", "control-panel", "widget.html"),
    css: readText("mcp", "widget-assets", "control-panel", "widget.css"),
    js: readText("mcp", "widget-assets", "control-panel", "widget.js"),
  });
  const metadata = widgetMetadata({
    description: "In-Codex visual control panel for configuring Ollama options for Codex App and Codex CLI.",
  });

  server.registerResource(
    "ollama-codex-control-panel",
    WIDGET_URI,
    {
      title: "Ollama for Codex Control Panel",
      description: "Manage Ollama readiness, models, Codex App, and Codex CLI from inside Codex.",
      mimeType: RESOURCE_MIME_TYPE,
      _meta: metadata,
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
          _meta: metadata,
        },
      ],
    }),
  );
}

function registerTools() {
  server.registerTool(
    "render_ollama_codex_panel",
    {
      title: "Render Ollama for Codex Panel",
      description: "Render the in-Codex visual control panel for Ollama.",
      inputSchema: {
        model: z.string().trim().optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: toolMeta("Opening Ollama panel...", "Ollama panel ready"),
    },
    async (input = {}) => {
      const status = await statusPayload();
      const models = await modelPayload();
      const recommendations = recommendationPayload();
      return widgetResult({
        message: "Rendered Ollama for Codex control panel.",
        data: {
          version: 1,
          widget: "ollama-codex-control-panel",
          selectedModel: String(input.model || status.appModel || recommendations.models[0]?.name || models.models[0]?.name || "gpt-oss:20b"),
          status,
          models,
          recommendations,
        },
      });
    },
  );

  server.registerTool(
    "ollama_codex_status",
    {
      title: "Check Ollama Codex Status",
      description: "Check local Ollama and Codex readiness for the control panel.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => ({ structuredContent: await statusPayload() }),
  );

  server.registerTool(
    "ollama_codex_models",
    {
      title: "List Ollama Models",
      description: "List local Ollama models for the control panel.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => ({ structuredContent: await modelPayload() }),
  );

  server.registerTool(
    "ollama_codex_action",
    {
      title: "Run Ollama Codex Action",
      description: "Run a supported Ollama for Codex action through the plugin wrapper.",
      inputSchema: {
        action: z.enum([
          "app-setup",
          "app-use-model",
          "app-restore",
          "cli-config",
          "cli-restore",
          "pull-model",
          "list-models",
          "status",
        ]),
        model: z.string().trim().optional(),
        dryRun: z.boolean().optional(),
        confirmed: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (input = {}) => ({ structuredContent: await runAction(input) }),
  );
}

async function statusPayload() {
  const result = await runWrapper(["status"], { timeout: 30000 });
  const text = `${result.stdout}\n${result.stderr}`.trim();
  const appIntegration = ollamaIntegrationPayload("codex-app");
  const codexConfig = codexConfigPayload();
  return {
    ok: result.exitCode === 0,
    output: text,
    ollamaInstalled: /\[ok\] ollama executable:/.test(text),
    ollamaVersion: text.match(/\[ok\] ollama version: ([0-9.]+)/)?.[1] || null,
    serverReachable: /\[ok\] ollama HTTP API: reachable/.test(text),
    codexInstalled: /\[ok\] codex executable:/.test(text),
    codexVersion: text.match(/\[info\] codex version: ([^\n]+)/)?.[1] || null,
    cliProfileConfigured: /\[ok\] Codex CLI Ollama profile:/.test(text),
    appBackupsExist: /\[ok\] Codex App Ollama backups:/.test(text),
    appConfigured: appIntegration.models.length > 0,
    appOnboarded: appIntegration.onboarded,
    appModel: appIntegration.models[0] || null,
    appModels: appIntegration.models,
    currentCodexModel: codexConfig.model,
    currentCodexProvider: codexConfig.modelProvider,
    currentUsesOllama: codexConfig.modelProvider === "ollama-launch-codex-app",
  };
}

async function modelPayload() {
  const result = await runWrapper(["list-models"], { timeout: 30000 });
  const models = parseOllamaList(result.stdout);
  return {
    ok: result.exitCode === 0,
    source: "ollama ls",
    models,
    output: `${result.stdout}\n${result.stderr}`.trim(),
  };
}

async function runAction(input) {
  const action = String(input.action || "");
  const model = String(input.model || "").trim();
  const dryRun = Boolean(input.dryRun);
  const confirmed = Boolean(input.confirmed);
  const modelActions = new Set(["app-use-model", "cli-config", "pull-model"]);
  const confirmedActions = new Set(["app-setup", "app-use-model", "app-restore", "cli-restore", "pull-model"]);

  if (modelActions.has(action) && !model) {
    return { ok: false, error: "Choose or enter a model first." };
  }
  if (confirmedActions.has(action) && !dryRun && !confirmed) {
    return {
      ok: false,
      requiresConfirmation: true,
      error: "Confirm this action before running it. Codex App actions may restart Codex.",
    };
  }

  const args = dryRun ? ["--dry-run", action] : [action];
  if (modelActions.has(action)) args.push(model);
  const result = await runWrapper(args, { timeout: action === "pull-model" ? 900000 : 120000 });
  return {
    ok: result.exitCode === 0,
    command: printable(["bash", wrapper, ...args]),
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function ollamaIntegrationPayload(name) {
  const config = readJson(ollamaConfigPath);
  const integration = config?.integrations?.[name] || {};
  const models = Array.isArray(integration.models) ? integration.models.filter((model) => typeof model === "string" && model.trim()) : [];
  return {
    models,
    onboarded: Boolean(integration.onboarded),
  };
}

function codexConfigPayload() {
  const text = readTextFile(codexConfigPath);
  return {
    model: topLevelTomlString(text, "model") || null,
    modelProvider: topLevelTomlString(text, "model_provider") || "openai",
  };
}

function recommendationPayload() {
  const data = readJson(ollamaRecommendationsPath);
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : [];
  return {
    source: "ollama model recommendations",
    models: recommendations
      .map((entry) => ({
        name: String(entry.model || "").trim(),
        description: String(entry.description || "Recommended by Ollama").trim(),
        contextLength: Number.isFinite(entry.context_length) ? entry.context_length : null,
        maxOutputTokens: Number.isFinite(entry.max_output_tokens) ? entry.max_output_tokens : null,
        requiredPlan: typeof entry.required_plan === "string" ? entry.required_plan : null,
        vramBytes: Number.isFinite(entry.vram_bytes) ? entry.vram_bytes : null,
      }))
      .filter((entry) => entry.name),
  };
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function readTextFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function topLevelTomlString(text, key) {
  const sectionStart = text.search(/^\s*\[/m);
  const topLevel = sectionStart === -1 ? text : text.slice(0, sectionStart);
  const match = topLevel.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m"));
  return match?.[1] || null;
}

async function runWrapper(args, options = {}) {
  try {
    const result = await execFileAsync("bash", [wrapper, ...args], {
      timeout: options.timeout || 30000,
      maxBuffer: 1024 * 1024 * 4,
      env: process.env,
    });
    return { exitCode: 0, stdout: result.stdout || "", stderr: result.stderr || "" };
  } catch (error) {
    return {
      exitCode: typeof error.code === "number" ? error.code : 1,
      stdout: error.stdout || "",
      stderr: error.stderr || error.message || "",
    };
  }
}

function parseOllamaList(text) {
  return text
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s{2,}/);
      return {
        name: parts[0],
        id: parts[1] || "",
        size: parts[2] || "",
        modified: parts[3] || "",
      };
    })
    .filter((model) => model.name);
}

function widgetResult({ message, data }) {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: summarizeWidget(data),
    _meta: {
      "openai/outputTemplate": WIDGET_URI,
      widgetData: data,
    },
  };
}

function summarizeWidget(data) {
  return {
    version: data.version,
    widget: data.widget,
    selectedModel: data.selectedModel,
    modelCount: data.models.models.length,
    recommendationCount: data.recommendations.models.length,
    appModel: data.status.appModel,
    currentCodexModel: data.status.currentCodexModel,
    currentCodexProvider: data.status.currentCodexProvider,
    ollamaVersion: data.status.ollamaVersion,
    serverReachable: data.status.serverReachable,
    codexVersion: data.status.codexVersion,
  };
}

function toolMeta(invoking, invoked) {
  return {
    ui: {
      resourceUri: WIDGET_URI,
      visibility: ["model", "app"],
    },
    "openai/outputTemplate": WIDGET_URI,
    "openai/widgetAccessible": true,
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
  };
}

function widgetMetadata({ description }) {
  return {
    ui: {
      prefersBorder: true,
      csp: {
        connectDomains: [],
        resourceDomains: [],
      },
    },
    "openai/widgetDescription": description,
    "openai/widgetPrefersBorder": true,
    "openai/widgetCSP": {
      connect_domains: [],
      resource_domains: [],
    },
  };
}

function inlineWidget({ html, css, js }) {
  const logo = svgDataUri(readText("assets", "logo.svg"));
  const merged = html
    .replace("/* __OLLAMA_CODEX_WIDGET_CSS__ */", css)
    .replace("/* __OLLAMA_CODEX_WIDGET_JS__ */", js.replace("__OLLAMA_CODEX_LOGO_DATA_URI__", logo));
  const bridge = [
    '<script id="ollamaCodexMcpAppsBundle">',
    escapeInlineScript(mcpAppsGlobalScript()),
    "</script>",
    '<script id="ollamaCodexMcpHostBridge">',
    hostBridgeScript(),
    "</script>",
  ].join("\n");
  return merged.replace("</head>", `${bridge}\n</head>`);
}

function readText(...parts) {
  return readFileSync(join(pluginRoot, ...parts), "utf8");
}

function svgDataUri(source) {
  return `data:image/svg+xml;base64,${Buffer.from(source).toString("base64")}`;
}

function mcpAppsGlobalScript() {
  if (cachedMcpAppsGlobalScript) return cachedMcpAppsGlobalScript;
  let source = "";
  try {
    source = readText("mcp", "vendor", "ext-apps-app-with-deps.js");
  } catch {
    source = readFileSync(require.resolve("@modelcontextprotocol/ext-apps/app-with-deps"), "utf8");
  }
  const exportStart = source.lastIndexOf("export{");
  if (exportStart === -1) throw new Error("Could not find ext-apps browser export block.");
  const exportBlock = source.slice(exportStart).match(/^export\{([^}]+)\};?\s*$/s);
  if (!exportBlock) throw new Error("Could not parse ext-apps browser export block.");
  const exportMap = parseExportMap(exportBlock[1]);
  const requiredExports = ["App", "applyDocumentTheme", "applyHostFonts", "applyHostStyleVariables"];
  cachedMcpAppsGlobalScript = [
    source.slice(0, exportStart),
    ";globalThis.__OLLAMA_CODEX_MCP_APPS__={",
    requiredExports.map((name) => `${JSON.stringify(name)}:${exportMap.get(name)}`).join(","),
    "};",
  ].join("");
  return cachedMcpAppsGlobalScript;
}

function parseExportMap(body) {
  const exportMap = new Map();
  for (const rawEntry of body.split(",")) {
    const entry = rawEntry.trim();
    if (!entry) continue;
    const parts = entry.split(/\s+as\s+/);
    const local = parts[0]?.trim();
    const exported = (parts[1] || parts[0])?.trim();
    if (local && exported) exportMap.set(exported, local);
  }
  return exportMap;
}

function hostBridgeScript() {
  return `(() => {
  "use strict";
  const apps = globalThis.__OLLAMA_CODEX_MCP_APPS__;
  if (!apps || typeof apps.App !== "function") return;
  let mcpApp = null;

  function publishHostGlobals(globals) {
    window.openai = Object.assign(window.openai || {}, globals);
    window.dispatchEvent(new CustomEvent("openai:set_globals", { detail: { globals: window.openai } }));
  }

  function applyHostContext(context) {
    if (!context) return;
    try {
      if (context.theme && typeof apps.applyDocumentTheme === "function") apps.applyDocumentTheme(context.theme);
      if (context.styles?.variables && typeof apps.applyHostStyleVariables === "function") apps.applyHostStyleVariables(context.styles.variables);
      if (context.styles?.css?.fonts && typeof apps.applyHostFonts === "function") apps.applyHostFonts(context.styles.css.fonts);
    } catch (_error) {}
    publishHostGlobals({
      hostContext: context,
      displayMode: context.displayMode,
      availableDisplayModes: context.availableDisplayModes,
      widgetInstanceId: context.widgetInstanceId || context.widgetId,
    });
  }

  function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), ms); });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  function currentSize() {
    const root = document.documentElement;
    const body = document.body;
    return {
      width: Math.ceil(window.innerWidth || root.clientWidth || 0),
      height: Math.ceil(Math.max(root.scrollHeight || 0, root.offsetHeight || 0, body?.scrollHeight || 0, body?.offsetHeight || 0)),
    };
  }

  function sendCurrentSize() {
    if (!mcpApp || typeof mcpApp.sendSizeChanged !== "function") return;
    try { mcpApp.sendSizeChanged(currentSize()); } catch (_error) {}
  }

  function promptFromMessage(message) {
    if (typeof message === "string") return message;
    if (message?.prompt) return String(message.prompt);
    if (typeof message?.content === "string") return message.content;
    return "";
  }

  function contentFromMessage(message, prompt) {
    if (message && Array.isArray(message.content)) return message.content;
    return [{ type: "text", text: prompt }];
  }

  function toBridgeError(error) {
    if (error instanceof Error) return error;
    return new Error(String(error || "Unable to use host bridge."));
  }

  function installApi(app) {
    const api = window.ollamaCodexMcp || {};
    window.ollamaCodexMcp = api;
    api.notifyResize = sendCurrentSize;
    api.callServerTool = async (request) => {
      try {
        if (!request?.name) throw new Error("Missing tool name.");
        if (!app || typeof app.callServerTool !== "function") throw new Error("Host bridge is unavailable.");
        if (app.ready) await withTimeout(app.ready, 4000, "Host bridge did not become ready.");
        const result = await withTimeout(app.callServerTool({
          name: String(request.name),
          arguments: request.arguments && typeof request.arguments === "object" ? request.arguments : {},
        }), 120000, "Host did not return a server tool result.");
        if (result?.isError) throw new Error("Host returned an error from the server tool.");
        return result || {};
      } catch (error) {
        throw toBridgeError(error);
      }
    };
    api.sendFollowUpMessage = async (message) => {
      try {
        const prompt = promptFromMessage(message);
        if (!prompt) throw new Error("Missing follow-up prompt.");
        if (!app || typeof app.sendMessage !== "function") throw new Error("Host bridge is unavailable.");
        if (app.ready) await withTimeout(app.ready, 4000, "Host bridge did not become ready.");
        const result = await withTimeout(app.sendMessage({
          role: "user",
          content: contentFromMessage(message, prompt),
        }), 8000, "Host did not accept the follow-up message.");
        if (result?.isError) throw new Error("Host rejected the follow-up message.");
        return result || {};
      } catch (error) {
        throw toBridgeError(error);
      }
    };
  }

  function payloadFromToolResult(result) {
    const metadata = result && typeof result === "object" ? result._meta || {} : {};
    const payload = metadata.widgetData || result?.structuredContent || result || {};
    return { metadata, payload };
  }

  function handleToolResult(result) {
    const { metadata, payload } = payloadFromToolResult(result);
    publishHostGlobals({ rawToolResult: result, toolOutput: payload, toolResponseMetadata: metadata });
    sendCurrentSize();
  }

  window.addEventListener("message", (event) => {
    const result = event.data?.params?.result;
    if (event.data?.method === "ui/notifications/tool-result" && result) handleToolResult(result);
  });

  try {
    mcpApp = new apps.App({ name: "ollama-codex-widget", version: "0.1.0" }, { availableDisplayModes: ["inline", "fullscreen"] }, { autoResize: true });
    installApi(mcpApp);
    mcpApp.addEventListener("hostcontextchanged", applyHostContext);
    mcpApp.addEventListener("toolresult", handleToolResult);
    mcpApp.ready = mcpApp.connect().then(() => {
      installApi(mcpApp);
      applyHostContext(mcpApp.getHostContext && mcpApp.getHostContext());
      sendCurrentSize();
    }).catch((error) => { globalThis.__OLLAMA_CODEX_MCP_HOST_ERROR__ = error; });
  } catch (error) {
    globalThis.__OLLAMA_CODEX_MCP_HOST_ERROR__ = error;
  }
})();`;
}

function escapeInlineScript(source) {
  return source.replaceAll("</script", "<\\\\/script").replaceAll("</SCRIPT", "<\\\\/SCRIPT");
}

function printable(parts) {
  return parts.map((part) => (String(part).includes(" ") ? JSON.stringify(part) : String(part))).join(" ");
}
