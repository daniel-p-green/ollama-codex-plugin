#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const pluginCwd = process.env.PLUGIN_CWD || "plugins/ollama-codex";
const widgetSource = readFileSync(join(pluginCwd, "mcp", "widget-assets", "control-panel", "widget.js"), "utf8");

const openAiProfileHtml = renderFixture({
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
        description: "Frontier Codex model",
        defaultReasoningLevel: "medium",
      },
      {
        name: "gpt-5.4",
        displayName: "GPT-5.4",
        description: "Everyday Codex model",
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
    ],
  },
  models: {
    models: [
      {
        name: "gemma4:latest",
        id: "local-gemma4",
        size: "9.6 GB",
      },
      {
        name: "gpt-oss:20b",
        id: "local-gpt-oss",
        size: "13 GB",
      },
    ],
  },
  selectedModel: "gpt-oss:20b",
  packageVersion: "0.6.0+fixture",
  supportsNativeCodexSwitch: true,
});

assertIncludes(openAiProfileHtml, "Model Switcher");
assertIncludes(openAiProfileHtml, "Ollama for Codex · 0.6.0");
assertIncludes(openAiProfileHtml, "native Codex switching enabled");
assertIncludes(openAiProfileHtml, "OpenAI/Codex profile is active");
assertIncludes(openAiProfileHtml, "Codex/OpenAI models");
assertIncludes(openAiProfileHtml, "GPT-5.4");
assertIncludes(openAiProfileHtml, "Everyday Codex model");
assertIncludes(openAiProfileHtml, "reasoning medium");
assertIncludes(openAiProfileHtml, "gpt-5.5");
assertIncludes(openAiProfileHtml, 'data-use-codex-model="gpt-5.4"');
assertIncludes(openAiProfileHtml, "gpt-oss:20b");
assertIncludes(openAiProfileHtml, "Configured");
assertIncludes(openAiProfileHtml, "Recommended for Codex");
assertIncludes(openAiProfileHtml, "Local models");
assertIncludes(openAiProfileHtml, "Filter models");
assertIncludes(openAiProfileHtml, 'data-use-model="gpt-oss:20b"');
assertIncludes(openAiProfileHtml, "Installed");
assertIncludes(openAiProfileHtml, '<span class="count">1</span>');
assertNotIncludes(openAiProfileHtml, "local-gpt-oss");

const ollamaProfileHtml = renderFixture({
  status: {
    currentCodexModel: "gpt-oss:20b",
    currentCodexProvider: "ollama-launch-codex-app",
    currentUsesOllama: true,
    previousCodexModel: "gpt-5.5",
    previousCodexProvider: "openai",
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
        description: "Frontier Codex model",
        defaultReasoningLevel: "medium",
      },
      {
        name: "gpt-5.4",
        displayName: "GPT-5.4",
        description: "Everyday Codex model",
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
    ],
  },
  models: {
    models: [
      {
        name: "gpt-oss:20b",
        id: "local-gpt-oss",
        size: "13 GB",
      },
    ],
  },
  selectedModel: "gpt-oss:20b",
});

assertIncludes(ollamaProfileHtml, "Codex/OpenAI models");
assertIncludes(ollamaProfileHtml, "GPT-5.5");
assertIncludes(ollamaProfileHtml, "GPT-5.4");
assertIncludes(ollamaProfileHtml, "Switches back to Codex/OpenAI and sets this native model.");
assertIncludes(ollamaProfileHtml, 'data-use-codex-model="gpt-5.5"');
assertIncludes(ollamaProfileHtml, ">Active</button>");
assertIncludes(ollamaProfileHtml, "model selected active");

const filteredHtml = renderFixture({
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
        description: "Frontier Codex model",
        defaultReasoningLevel: "medium",
      },
    ],
  },
  recommendations: {
    models: [
      {
        name: "kimi-k2.6:cloud",
        description: "Cloud coding model",
      },
      {
        name: "gpt-oss:20b",
        description: "Open-weight local coding model",
      },
    ],
  },
  models: {
    models: [
      {
        name: "gemma4:latest",
        id: "local-gemma4",
        size: "9.6 GB",
      },
      {
        name: "gpt-oss:20b",
        id: "local-gpt-oss",
        size: "13 GB",
      },
    ],
  },
  selectedModel: "gpt-oss:20b",
  filterText: "gemma",
});

assertIncludes(filteredHtml, 'value="gemma"');
assertIncludes(filteredHtml, "gemma4:latest");
assertIncludes(filteredHtml, '<span class="count">0</span>');
assertNotIncludes(filteredHtml, "local-gpt-oss");

console.log("[ok] widget fixture probe");

function renderFixture(widgetData) {
  const app = {
    innerHTML: "",
    querySelector() {
      return eventTargetStub();
    },
    querySelectorAll() {
      return [];
    },
  };
  const context = {
    console,
    document: {
      getElementById(id) {
        if (id !== "app") throw new Error(`unexpected element id: ${id}`);
        return app;
      },
    },
    window: {
      openai: {
        toolResponseMetadata: {
          widgetData: {
            version: 1,
            widget: "ollama-codex-control-panel",
            ...widgetData,
          },
        },
      },
      addEventListener() {},
      ollamaCodexMcp: {
        notifyResize() {},
      },
    },
  };

  vm.runInNewContext(widgetSource, context, {
    filename: "widget.js",
  });
  return app.innerHTML;
}

function eventTargetStub() {
  return {
    addEventListener() {},
    getAttribute() {
      return "";
    },
  };
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`widget fixture missing: ${expected}`);
  }
}

function assertNotIncludes(text, unexpected) {
  if (text.includes(unexpected)) {
    throw new Error(`widget fixture unexpectedly included: ${unexpected}`);
  }
}
