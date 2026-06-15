#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
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
  cwd: "./plugins/ollama-codex",
});

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

  console.log("[ok] MCP widget server probe");
} finally {
  await client.close().catch(() => {});
}
