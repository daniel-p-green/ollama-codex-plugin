(function () {
  "use strict";

  const FALLBACK_RECOMMENDATIONS = [
    {
      name: "kimi-k2.6:cloud",
      description: "State-of-the-art coding and long-horizon execution",
      requiredPlan: "pro",
      contextLength: 262144,
    },
    {
      name: "gpt-oss:120b-cloud",
      description: "Open-weight reasoning through Ollama Cloud",
      requiredPlan: "free",
    },
  ];

  const app = document.getElementById("app");
  let state = hydrate(readToolOutput());

  window.addEventListener("openai:set_globals", () => {
    const output = readToolOutput();
    if (isWidgetPayload(output)) {
      state = hydrate(output);
      render();
    }
  });

  function readToolOutput() {
    const openai = window.openai || {};
    const metadata = openai.toolResponseMetadata || {};
    return metadata.widgetData || normalizeToolPayload(openai.toolOutput) || {};
  }

  function normalizeToolPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    if (payload._meta?.widgetData) return payload._meta.widgetData;
    if (payload.structuredContent && (payload.content || payload._meta || payload.isError !== undefined)) {
      return payload.structuredContent;
    }
    return payload;
  }

  function hydrate(output) {
    const status = output.status || {};
    const models = output.models || {};
    const recommendations = output.recommendations || {};
    const recommendationModels = Array.isArray(recommendations.models) && recommendations.models.length ? recommendations.models : FALLBACK_RECOMMENDATIONS;
    return {
      selectedModel: String(output.selectedModel || status.appModel || recommendationModels[0]?.name || models.models?.[0]?.name || "gpt-oss:20b"),
      status,
      models: Array.isArray(models.models) ? models.models : [],
      recommendations: recommendationModels,
      filterText: String(output.filterText || ""),
      output: "Ready.",
      lastCommand: "",
      busy: false,
    };
  }

  function isWidgetPayload(output) {
    return Boolean(output && typeof output === "object" && (output.widget === "ollama-codex-control-panel" || (output.status && output.models)));
  }

  function render() {
    app.innerHTML = [
      '<section class="header">',
      '<div class="brand">',
      '<img class="logo" src="__OLLAMA_CODEX_LOGO_DATA_URI__" alt="" />',
      '<div><p class="eyebrow">Ollama for Codex</p><h1>Model Switcher</h1></div>',
      '</div>',
      '<button class="secondary" type="button" data-action="refresh">Refresh</button>',
      '</section>',
      renderStatus(),
      '<section class="grid">',
      renderModels(),
      renderActions(),
      '</section>',
      renderOutput(),
    ].join("");

    bindEvents();
    notifyResize();
  }

  function renderStatus() {
    return [
      '<section class="status" aria-label="Readiness">',
      statusCard("Ollama", state.status.ollamaVersion || "Not found", state.status.ollamaInstalled),
      statusCard("Server", state.status.serverReachable ? "Reachable" : "Offline", state.status.serverReachable),
      statusCard("Codex Model", state.status.currentCodexModel || "Unknown", Boolean(state.status.currentCodexModel)),
      statusCard("Ollama App", state.status.appModel || "Not configured", state.status.appConfigured),
      statusCard("Codex CLI", state.status.codexVersion || "Not found", state.status.codexInstalled),
      statusCard("CLI Profile", state.status.cliProfileConfigured ? "Configured" : "Not configured", state.status.cliProfileConfigured),
      '</section>',
    ].join("");
  }

  function statusCard(label, value, ok) {
    return '<article class="card"><span class="dot ' + (ok ? "ok" : "bad") + '"></span><p>' + text(label) + '</p><strong>' + text(value) + '</strong></article>';
  }

  function renderModels() {
    const localNames = new Set(state.models.map((model) => normalizeModelName(model.name)));
    const recommendationNames = new Set(state.recommendations.map((model) => normalizeModelName(model.name)));
    const recommendations = filteredModels(state.recommendations).map((model) => ({
      ...model,
      installed: localNames.has(normalizeModelName(model.name)),
    }));
    const localModels = filteredModels(state.models.filter((model) => !recommendationNames.has(normalizeModelName(model.name))));
    return [
      '<section class="panel">',
      '<div class="panel-head"><div><h2>Codex App Model</h2><p class="subtle">' + text(modelSummary()) + '</p></div><button class="secondary" type="button" data-action="list-models">Refresh</button></div>',
      renderCodexProfile(),
      '<div class="row"><input id="modelInput" type="text" value="' + attr(state.selectedModel) + '" aria-label="Model name" /><button type="button" data-action="app-use-model">Switch</button><button class="secondary" type="button" data-action="pull-model">Pull</button></div>',
      '<input id="modelFilter" type="search" value="' + attr(state.filterText) + '" placeholder="Filter models" aria-label="Filter models" />',
      '<div class="model-group" aria-label="Recommended Ollama models">',
      sectionLabel("Recommended for Codex", recommendations.length),
      recommendations.length ? recommendations.map(renderRecommendation).join("") : renderEmptyModels(),
      '</div>',
      '<div class="model-group" aria-label="Local Ollama models">',
      sectionLabel("Local models", localModels.length),
      '<div class="models" role="list">',
      localModels.length ? localModels.map(renderModel).join("") : renderEmptyModels(),
      '</div>',
      '</div>',
      '</section>',
    ].join("");
  }

  function sectionLabel(label, count) {
    return '<p class="section-label"><span>' + text(label) + '</span><span class="count">' + text(count) + '</span></p>';
  }

  function filteredModels(models) {
    const query = state.filterText.trim().toLowerCase();
    if (!query) return models;
    const terms = query.split(/\s+/).filter(Boolean);
    return models.filter((model) => {
      const haystack = [
        model.name,
        model.description,
        model.meta,
        model.id,
        model.size,
        model.requiredPlan,
        recommendationMeta(model),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }

  function renderEmptyModels() {
    return '<p class="subtle">No matching models.</p>';
  }

  function normalizeModelName(name) {
    return String(name || "").trim().toLowerCase();
  }

  function modelSummary() {
    const current = state.status.currentCodexModel || "unknown";
    const app = state.status.appModel || "not configured";
    return "Active Codex: " + current + " / Ollama App: " + app;
  }

  function renderCodexProfile() {
    const activeModel = state.status.currentCodexModel || "Unknown";
    const isOllama = Boolean(state.status.currentUsesOllama);
    const title = isOllama ? "OpenAI/Codex profile" : activeModel;
    const detail = isOllama ? "Restore previous Codex profile" : "OpenAI/Codex profile is active";
    const meta = isOllama ? "available" : "active";
    return [
      '<div class="model-group" aria-label="Codex profile">',
      '<p class="section-label">Codex profile</p>',
      '<article class="model codex-profile' + (!isOllama ? " selected" : "") + '" role="listitem">',
      '<div class="model-main passive">',
      '<span><span class="model-title"><strong>' + text(title) + '</strong>' + (!isOllama ? badge("Active") : "") + '</span><span class="subtle">' + text(detail) + '</span></span>',
      '<span class="subtle">' + text(meta) + '</span>',
      '</div>',
      isOllama ? '<button class="model-use" type="button" data-action="app-restore">Restore</button>' : '<button class="model-use" type="button" disabled>Active</button>',
      '</article>',
      '</div>',
    ].join("");
  }

  function renderRecommendation(model) {
    return modelRow({
      name: model.name,
      description: model.description || "Recommended by Ollama",
      meta: recommendationMeta(model),
      installed: model.installed,
    });
  }

  function renderModel(model) {
    return modelRow({
      name: model.name,
      description: model.id || "local model",
      meta: model.size || "local",
    });
  }

  function modelRow(model) {
    const selected = model.name === state.selectedModel;
    const current = isCurrentOllamaModel(model.name);
    const configured = model.name === state.status.appModel;
    return [
      '<article class="model' + (selected ? " selected" : "") + (current ? " active" : "") + '" role="listitem">',
      '<button class="model-main" type="button" data-select-model="' + attr(model.name) + '">',
      '<span><span class="model-title"><strong>' + text(model.name) + '</strong>' + modelBadges({ current, configured, installed: model.installed }) + '</span><span class="subtle">' + text(model.description) + '</span></span>',
      '<span class="subtle">' + text(model.meta) + '</span>',
      '</button>',
      '<button class="model-use" type="button" data-use-model="' + attr(model.name) + '"' + (current ? " disabled" : "") + '>' + text(current ? "Active" : "Switch") + '</button>',
      '</article>',
    ].join("");
  }

  function isCurrentOllamaModel(name) {
    return Boolean(state.status.currentUsesOllama && state.status.currentCodexModel === name);
  }

  function modelBadges({ current, configured, installed }) {
    const labels = [];
    if (current) labels.push("Active");
    else if (configured) labels.push("Configured");
    if (installed && !current) labels.push("Installed");
    return labels.map(badge).join("");
  }

  function badge(label) {
    return '<span class="badge">' + text(label) + '</span>';
  }

  function recommendationMeta(model) {
    if (model.requiredPlan) return String(model.requiredPlan) + " cloud";
    if (model.contextLength) return formatContext(model.contextLength);
    if (model.vramBytes) return formatVram(model.vramBytes);
    return model.name.endsWith(":cloud") || model.name.endsWith("-cloud") ? "cloud" : "local";
  }

  function formatContext(value) {
    if (!Number.isFinite(value)) return "";
    return Math.round(value / 1024) + "k ctx";
  }

  function formatVram(value) {
    if (!Number.isFinite(value)) return "";
    return Math.round(value / 1000000000) + "GB VRAM";
  }

  function renderActions() {
    return [
      '<section class="panel">',
      '<div class="panel-head"><div><h2>Codex App</h2><p class="subtle">Official Ollama launch commands for setup and restore.</p></div></div>',
      '<div class="actions">',
      '<button type="button" data-action="app-setup">Set Up App</button>',
      '<button class="secondary" type="button" data-action="preview">Preview Switch</button>',
      '<button class="danger" type="button" data-action="app-restore">Restore App</button>',
      '</div>',
      '<div class="panel-head" style="margin-top:18px"><div><h2>Codex CLI</h2><p class="subtle">Configure or restore the Ollama CLI profile.</p></div></div>',
      '<div class="actions two">',
      '<button type="button" data-action="cli-config">Configure CLI</button>',
      '<button class="danger" type="button" data-action="cli-restore">Restore CLI</button>',
      '</div>',
      '</section>',
    ].join("");
  }

  function renderOutput() {
    return [
      '<section class="panel" aria-label="Command output">',
      '<div class="panel-head"><div><h2>Output</h2><p class="subtle">' + text(state.lastCommand || "No command run yet.") + '</p></div></div>',
      '<pre>' + text(state.busy ? "Working..." : state.output) + '</pre>',
      '</section>',
    ].join("");
  }

  function bindEvents() {
    app.querySelector('[data-action="refresh"]').addEventListener("click", refresh);
    app.querySelector('[data-action="list-models"]').addEventListener("click", listModels);
    app.querySelector('[data-action="preview"]').addEventListener("click", () => runAction("app-use-model", true));
    app.querySelector('[data-action="pull-model"]').addEventListener("click", () => runAction("pull-model", false, undefined, true));
    app.querySelectorAll("[data-action]").forEach((button) => {
      const action = button.getAttribute("data-action");
      if (["app-setup", "app-restore", "cli-config", "cli-restore"].includes(action)) {
        button.addEventListener("click", () => runAction(action, false, undefined, true));
      }
      if (action === "app-use-model") {
        button.addEventListener("click", () => runAction("app-use-model", false, undefined, true));
      }
    });
    app.querySelectorAll("[data-select-model]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedModel = button.getAttribute("data-select-model");
        render();
      });
    });
    app.querySelectorAll("[data-use-model]").forEach((button) => {
      button.addEventListener("click", () => runAction("app-use-model", false, button.getAttribute("data-use-model"), true));
    });
    app.querySelector("#modelInput").addEventListener("input", (event) => {
      state.selectedModel = event.target.value;
    });
    app.querySelector("#modelFilter").addEventListener("input", (event) => {
      state.filterText = event.target.value;
      render();
    });
  }

  async function refresh() {
    state.busy = true;
    render();
    try {
      const status = await callTool("ollama_codex_status", {});
      state.status = unwrap(status);
      await listModels(false);
      state.output = state.status.output || "Status refreshed.";
      state.lastCommand = "status";
    } catch (error) {
      state.output = errorMessage(error);
      state.lastCommand = "status failed";
    }
    state.busy = false;
    render();
  }

  async function listModels(shouldRender = true) {
    if (shouldRender) {
      state.busy = true;
      render();
    }
    try {
      const models = unwrap(await callTool("ollama_codex_models", {}));
      state.models = models.models || [];
      state.output = models.output || "Models refreshed.";
      state.lastCommand = "list-models";
    } catch (error) {
      state.output = errorMessage(error);
      state.lastCommand = "list-models failed";
    }
    state.busy = false;
    render();
  }

  async function runAction(action, dryRun, modelOverride, confirmedOverride) {
    if (modelOverride) state.selectedModel = modelOverride;
    state.busy = true;
    render();
    try {
      const result = unwrap(await callTool("ollama_codex_action", {
        action,
        model: state.selectedModel,
        dryRun,
        confirmed: Boolean(confirmedOverride),
      }));
      state.lastCommand = result.command || action;
      state.output = [result.stdout, result.stderr, result.error].filter(Boolean).join("\\n\\n") || JSON.stringify(result, null, 2);
      if (result.ok && action === "app-use-model") {
        state.status.appConfigured = true;
        state.status.appModel = state.selectedModel;
        state.status.appModels = [state.selectedModel];
        state.status.currentCodexModel = state.selectedModel;
        state.status.currentCodexProvider = "ollama-launch-codex-app";
        state.status.currentUsesOllama = true;
      }
      if (result.ok && action === "app-setup") {
        await refresh();
        return;
      }
      if (result.ok && action === "app-restore") {
        state.status.currentUsesOllama = false;
        await refresh();
        return;
      }
    } catch (error) {
      state.lastCommand = action + " failed";
      state.output = errorMessage(error);
    }
    state.busy = false;
    render();
  }

  async function callTool(name, args) {
    const bridge = window.ollamaCodexMcp;
    if (!bridge || typeof bridge.callServerTool !== "function") {
      throw new Error("Codex widget bridge is unavailable.");
    }
    return bridge.callServerTool({ name, arguments: args });
  }

  function unwrap(result) {
    return result?.structuredContent || result?._meta?.widgetData || result || {};
  }

  function notifyResize() {
    if (window.ollamaCodexMcp && typeof window.ollamaCodexMcp.notifyResize === "function") {
      window.ollamaCodexMcp.notifyResize();
    }
  }

  function errorMessage(error) {
    if (error instanceof Error && error.message) return error.message;
    return String(error || "Unable to complete the Ollama Codex action.");
  }

  function attr(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function text(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  render();
}());
