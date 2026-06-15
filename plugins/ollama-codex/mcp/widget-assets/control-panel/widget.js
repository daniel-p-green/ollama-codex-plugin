(function () {
  "use strict";

  const app = document.getElementById("app");
  let state = hydrate(readToolOutput());

  window.addEventListener("openai:set_globals", () => {
    state = hydrate(readToolOutput());
    render();
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
    return {
      selectedModel: String(output.selectedModel || models.models?.[0]?.name || "gemma4:latest"),
      status,
      models: Array.isArray(models.models) ? models.models : [],
      output: "Ready.",
      lastCommand: "",
      busy: false,
      confirmed: false,
    };
  }

  function render() {
    app.innerHTML = [
      '<section class="header">',
      '<div class="brand">',
      '<img class="logo" src="__OLLAMA_CODEX_LOGO_DATA_URI__" alt="" />',
      '<div><p class="eyebrow">Ollama for Codex</p><h1>Control Panel</h1></div>',
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
      statusCard("Codex CLI", state.status.codexVersion || "Not found", state.status.codexInstalled),
      statusCard("CLI Profile", state.status.cliProfileConfigured ? "Configured" : "Not configured", state.status.cliProfileConfigured),
      '</section>',
    ].join("");
  }

  function statusCard(label, value, ok) {
    return '<article class="card"><span class="dot ' + (ok ? "ok" : "bad") + '"></span><p>' + text(label) + '</p><strong>' + text(value) + '</strong></article>';
  }

  function renderModels() {
    return [
      '<section class="panel">',
      '<div class="panel-head"><div><h2>Model</h2><p class="subtle">Pick a local model or type an Ollama Cloud tag.</p></div><button class="secondary" type="button" data-action="list-models">List</button></div>',
      '<div class="row"><input id="modelInput" type="text" value="' + attr(state.selectedModel) + '" aria-label="Model name" /><button type="button" data-action="pull-model">Pull</button></div>',
      '<div class="models" role="list">',
      state.models.length ? state.models.map(renderModel).join("") : '<p class="subtle">No local models found. Type a cloud model tag or pull a model.</p>',
      '</div>',
      '</section>',
    ].join("");
  }

  function renderModel(model) {
    return [
      '<button class="model" type="button" data-model="' + attr(model.name) + '">',
      '<span><strong>' + text(model.name) + '</strong><span class="subtle">' + text(model.id || "local model") + '</span></span>',
      '<span class="subtle">' + text(model.size || "") + '</span>',
      '</button>',
    ].join("");
  }

  function renderActions() {
    return [
      '<section class="panel">',
      '<div class="panel-head"><div><h2>Codex App</h2><p class="subtle">Official Ollama launch commands. App actions may restart Codex.</p></div></div>',
      '<div class="actions">',
      '<button type="button" data-action="app-setup">Set Up App</button>',
      '<button type="button" data-action="app-use-model">Use Model</button>',
      '<button class="danger" type="button" data-action="app-restore">Restore App</button>',
      '</div>',
      '<div class="panel-head" style="margin-top:18px"><div><h2>Codex CLI</h2><p class="subtle">Configure or restore the Ollama CLI profile.</p></div></div>',
      '<div class="actions two">',
      '<button type="button" data-action="cli-config">Configure CLI</button>',
      '<button class="danger" type="button" data-action="cli-restore">Restore CLI</button>',
      '</div>',
      '<label class="confirm"><input id="confirmInput" type="checkbox" ' + (state.confirmed ? "checked" : "") + ' /> <span>I understand selected actions may change Codex profile state or restart Codex.</span></label>',
      '<button class="secondary" type="button" data-action="preview">Preview Selected Action</button>',
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
    app.querySelector('[data-action="pull-model"]').addEventListener("click", () => runAction("pull-model", false));
    app.querySelectorAll("[data-action]").forEach((button) => {
      const action = button.getAttribute("data-action");
      if (["app-setup", "app-use-model", "app-restore", "cli-config", "cli-restore"].includes(action)) {
        button.addEventListener("click", () => runAction(action, false));
      }
    });
    app.querySelectorAll("[data-model]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedModel = button.getAttribute("data-model");
        render();
      });
    });
    app.querySelector("#modelInput").addEventListener("input", (event) => {
      state.selectedModel = event.target.value;
    });
    app.querySelector("#confirmInput").addEventListener("change", (event) => {
      state.confirmed = event.target.checked;
    });
  }

  async function refresh() {
    state.busy = true;
    render();
    const status = await callTool("ollama_codex_status", {});
    state.status = unwrap(status);
    await listModels(false);
    state.output = state.status.output || "Status refreshed.";
    state.lastCommand = "status";
    state.busy = false;
    render();
  }

  async function listModels(shouldRender = true) {
    if (shouldRender) {
      state.busy = true;
      render();
    }
    const models = unwrap(await callTool("ollama_codex_models", {}));
    state.models = models.models || [];
    state.output = models.output || "Models refreshed.";
    state.lastCommand = "list-models";
    state.busy = false;
    render();
  }

  async function runAction(action, dryRun) {
    state.busy = true;
    render();
    const result = unwrap(await callTool("ollama_codex_action", {
      action,
      model: state.selectedModel,
      dryRun,
      confirmed: state.confirmed,
    }));
    state.lastCommand = result.command || action;
    state.output = [result.stdout, result.stderr, result.error].filter(Boolean).join("\\n\\n") || JSON.stringify(result, null, 2);
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

  function attr(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function text(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  render();
}());
