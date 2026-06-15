#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pluginCwd = process.env.PLUGIN_CWD || "./plugins/ollama-codex";
const transport = new StdioClientTransport(mcpTransportConfig());

const client = new Client({ name: "ollama-codex-probe", version: "1.0.0" });

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const names = new Set(tools.tools.map((tool) => tool.name));
  for (const required of [
    "render_ollama_codex_panel",
    "ollama_codex_status",
    "ollama_codex_models",
    "ollama_codex_action",
  ]) {
    if (!names.has(required)) {
      throw new Error(`missing MCP tool: ${required}`);
    }
  }

  const rendered = await client.callTool({
    name: "render_ollama_codex_panel",
    arguments: { model: "gemma4:latest" },
  });
  if (rendered._meta?.["openai/outputTemplate"] !== "ui://widget/ollama-codex-control-panel.html") {
    throw new Error("render tool did not return the control panel widget template");
  }
  if (rendered.structuredContent?.widget !== "ollama-codex-control-panel") {
    throw new Error("render tool did not return control panel structured content");
  }
  if (!("currentCodexModel" in (rendered.structuredContent || {}))) {
    throw new Error("render tool did not include current Codex model summary");
  }
  if (!("previousCodexModel" in (rendered.structuredContent || {}))) {
    throw new Error("render tool did not include previous Codex model summary");
  }
  if (!("codexModelCount" in (rendered.structuredContent || {}))) {
    throw new Error("render tool did not include Codex model catalog summary");
  }
  if (!("recommendationCount" in (rendered.structuredContent || {}))) {
    throw new Error("render tool did not include Ollama recommendation summary");
  }

  const resources = await client.listResources();
  const resource = resources.resources.find((entry) => entry.uri === "ui://widget/ollama-codex-control-panel.html");
  if (!resource) {
    throw new Error("control panel widget resource was not listed");
  }

  const widget = await client.readResource({ uri: resource.uri });
  const widgetHtml = widget.contents?.[0]?.text || "";
  if (!widgetHtml.includes("data:image/svg+xml;base64,")) {
    throw new Error("widget resource did not inline the packaged Ollama logo");
  }
  if (widgetHtml.includes("__OLLAMA_CODEX_LOGO_DATA_URI__")) {
    throw new Error("widget resource still contains the logo placeholder");
  }
  for (const required of [
    "data-use-model",
    "kimi-k2.6:cloud",
    "Recommended for Codex",
    "Codex/OpenAI models",
    "Codex/OpenAI catalog",
    "native OpenAI model selector",
    "codexModelDescription",
    "currentUsesOllama",
    "modelBadges",
    "Configured",
    "Filter models",
    "filteredModels",
    "sectionLabel",
    "Installed",
    "Switch",
    "confirmed: Boolean(confirmedOverride)",
    "errorMessage(error)",
  ]) {
    if (!widgetHtml.includes(required)) {
      throw new Error(`widget resource missing model switcher marker: ${required}`);
    }
  }

  const action = await client.callTool({
    name: "ollama_codex_action",
    arguments: {
      action: "app-use-model",
      model: "gemma4:latest",
      dryRun: true,
    },
  });
  if (!action.structuredContent?.ok) {
    throw new Error("dry-run action failed");
  }
  if (!String(action.structuredContent.stdout || "").includes("ollama launch codex-app --model gemma4:latest --yes")) {
    throw new Error("dry-run action did not route to the expected Ollama command");
  }

  const blockedAction = await client.callTool({
    name: "ollama_codex_action",
    arguments: {
      action: "app-use-model",
      model: "gemma4:latest",
    },
  });
  if (!blockedAction.structuredContent?.requiresConfirmation) {
    throw new Error("non-dry-run App switch was not confirmation-gated");
  }

  console.log("[ok] MCP widget server probe");
} finally {
  await client.close().catch(() => {});
}

function mcpTransportConfig() {
  if (hasLocalServerDeps()) {
    return {
      command: "node",
      args: ["./mcp/server.mjs"],
      cwd: pluginCwd,
    };
  }

  return {
    command: "npx",
    args: [
      "-y",
      "-p",
      "@modelcontextprotocol/sdk@1.29.0",
      "-p",
      "zod@4.4.2",
      "node",
      "./mcp/server.mjs",
    ],
    cwd: pluginCwd,
  };
}

function hasLocalServerDeps() {
  const home = process.env.HOME || "";
  return [
    join(home, "node_modules", "@modelcontextprotocol", "sdk", "package.json"),
    join(home, "node_modules", "zod", "package.json"),
  ].every((path) => existsSync(path));
}
