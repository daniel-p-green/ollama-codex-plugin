const state = {
  selectedAction: null,
  models: [],
};

const knownActions = new Set(["app-setup", "app-use-model", "app-restore", "cli-config", "cli-restore", "pull-model"]);

const elements = {
  refresh: document.querySelector("#refresh"),
  dryRun: document.querySelector("#dry-run"),
  listModels: document.querySelector("#list-models"),
  pullModel: document.querySelector("#pull-model"),
  modelInput: document.querySelector("#model-input"),
  modelList: document.querySelector("#model-list"),
  modelTable: document.querySelector("#model-table"),
  confirm: document.querySelector("#confirm"),
  output: document.querySelector("#output"),
  lastCommand: document.querySelector("#last-command"),
};

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!knownActions.has(button.dataset.action)) return;
    state.selectedAction = button.dataset.action;
    await runAction(state.selectedAction, { dryRun: false });
  });
});

elements.refresh.addEventListener("click", refresh);
elements.listModels.addEventListener("click", listModels);
elements.pullModel.addEventListener("click", () => runAction("pull-model", { dryRun: false }));
elements.dryRun.addEventListener("click", () => {
  const action = state.selectedAction || "app-use-model";
  runAction(action, { dryRun: true });
});

await refresh();

async function refresh() {
  setOutput("Refreshing status...");
  const status = await getJson("/api/status");
  renderStatus(status);
  if (status.models?.items) {
    state.models = status.models.items;
    renderModels();
  }
  setOutput("Ready.");
}

async function listModels() {
  setOutput("Loading models...");
  const payload = await getJson("/api/models");
  state.models = payload.models || [];
  renderModels();
  setOutput(payload.ok ? `Found ${state.models.length} model(s).` : payload.error || "Unable to load models.");
}

async function runAction(action, options) {
  const model = elements.modelInput.value.trim();
  const payload = await postJson("/api/action", {
    action,
    model,
    dryRun: Boolean(options.dryRun),
    confirmed: elements.confirm.checked,
  });

  elements.lastCommand.textContent = payload.command || payload.error || "No command produced.";
  const output = [
    payload.command ? `$ ${payload.command}` : "",
    payload.stdout || "",
    payload.stderr ? `stderr:\n${payload.stderr}` : "",
    payload.error ? `error: ${payload.error}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  setOutput(output || JSON.stringify(payload, null, 2));

  if (payload.ok) {
    await refreshModels();
  }
}

function renderStatus(status) {
  const ollamaOk = status.ollama?.installed && status.ollama?.meetsCodexAppMinimum;
  const serverOk = status.ollama?.serverReachable;
  const codexOk = status.codex?.installed;
  const profileOk = status.codex?.cliConfigExists && status.codex?.cliCatalogExists;

  setTile("ollama", ollamaOk, status.ollama?.version || "Not found");
  setTile("server", serverOk, serverOk ? "Reachable" : "Offline");
  setTile("codex", codexOk, status.codex?.version || "Not found");
  setTile("profile", profileOk, profileOk ? status.codex?.cliConfiguredModel || "Configured" : "Not configured");
}

function setTile(id, ok, text) {
  const dot = document.querySelector(`#${id}-dot`);
  const label = document.querySelector(`#${id}-status`);
  dot.className = `dot ${ok ? "ok" : "bad"}`;
  label.textContent = text;
}

function renderModels() {
  elements.modelList.replaceChildren(
    ...state.models.map((model) => {
      const option = document.createElement("option");
      option.value = model.name;
      return option;
    }),
  );

  if (!state.models.length) {
    elements.modelTable.innerHTML = '<div class="model-item"><strong>No local models found</strong><span>Use Pull or type a cloud tag.</span></div>';
    return;
  }

  elements.modelTable.replaceChildren(
    ...state.models.map((model) => {
      const row = document.createElement("button");
      row.className = "model-item";
      row.type = "button";
      row.innerHTML = `
        <span><strong></strong><span></span></span>
        <span>${formatSize(model.size)}</span>
      `;
      row.querySelector("strong").textContent = model.name;
      row.querySelector("span span").textContent = [model.parameterSize, model.quantizationLevel].filter(Boolean).join(" / ") || "local model";
      row.addEventListener("click", () => {
        elements.modelInput.value = model.name;
      });
      return row;
    }),
  );
}

async function refreshModels() {
  const payload = await getJson("/api/models");
  state.models = payload.models || [];
  renderModels();
}

function formatSize(size) {
  if (typeof size === "string") return size;
  if (!size) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(size);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function setOutput(text) {
  elements.output.textContent = text;
}

async function getJson(url) {
  const response = await fetch(url);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}
