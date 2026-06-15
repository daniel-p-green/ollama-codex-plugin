#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const execFileAsync = promisify(execFile);

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const pluginRoot = normalize(join(scriptDir, ".."));
const panelRoot = join(pluginRoot, "panel");
const defaultHost = "127.0.0.1";
const defaultPort = 17841;
const wrapper = join(pluginRoot, "scripts", "ollama-codex.sh");

const args = parseArgs(process.argv.slice(2));
const host = args.host || defaultHost;
const port = Number(args.port || process.env.OLLAMA_CODEX_PANEL_PORT || defaultPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("[error] --port must be a valid TCP port");
  process.exit(2);
}

const server = createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log(`[ok] Ollama for Codex control panel: ${url}`);
  console.log("[info] Press Ctrl-C to stop.");
  if (args.open) {
    openUrl(url).catch((error) => {
      console.error(`[warn] unable to open browser: ${error.message}`);
    });
  }
});

async function route(req, res) {
  const url = new URL(req.url || "/", `http://${host}:${port}`);

  if (req.method === "GET" && url.pathname === "/api/status") {
    sendJson(res, 200, await getStatus());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/models") {
    sendJson(res, 200, await getModels());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/action") {
    const body = await readJson(req);
    sendJson(res, 200, await runAction(body));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/assets/")) {
    await serveFile(res, join(pluginRoot, url.pathname.slice(1)));
    return;
  }

  if (req.method === "GET" && url.pathname === "/favicon.ico") {
    await serveFile(res, join(pluginRoot, "assets", "icon.svg"));
    return;
  }

  if (req.method === "GET") {
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    await serveFile(res, join(panelRoot, path));
    return;
  }

  sendJson(res, 405, { ok: false, error: "method not allowed" });
}

async function getStatus() {
  const [ollamaPath, codexPath, ollamaVersion, serverVersion, models] = await Promise.all([
    commandPath("ollama"),
    commandPath("codex"),
    commandOutput("ollama", ["--version"]),
    fetchJson(`${ollamaBaseUrl()}/api/version`),
    getModels(),
  ]);

  const parsedOllamaVersion = parseVersion(ollamaVersion.stdout);
  const cliConfigPath = join(codexHome(), "ollama-launch.config.toml");
  const cliCatalogPath = join(codexHome(), "model.json");
  const appBackupPath = join(os.homedir(), ".ollama", "backup", "codex-app");

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    ollama: {
      installed: Boolean(ollamaPath),
      path: ollamaPath || null,
      rawVersion: ollamaVersion.stdout.trim() || ollamaVersion.stderr.trim() || null,
      version: parsedOllamaVersion,
      meetsCodexAppMinimum: parsedOllamaVersion ? semverGte(parsedOllamaVersion, "0.24.0") : false,
      serverReachable: serverVersion.ok,
      serverVersion: serverVersion.ok ? serverVersion.data : null,
      host: ollamaBaseUrl(),
    },
    models: {
      reachable: models.ok,
      count: models.models.length,
      items: models.models,
    },
    codex: {
      installed: Boolean(codexPath),
      path: codexPath || null,
      version: codexPath ? (await commandOutput("codex", ["--version"])).stdout.trim() : null,
      cliConfigPath,
      cliConfigExists: existsSync(cliConfigPath),
      cliCatalogPath,
      cliCatalogExists: existsSync(cliCatalogPath),
      cliConfiguredModel: await readConfiguredModel(cliConfigPath),
      appBackupPath,
      appBackupsExist: existsSync(appBackupPath),
    },
  };
}

async function getModels() {
  const tags = await fetchJson(`${ollamaBaseUrl()}/api/tags`);
  if (tags.ok && Array.isArray(tags.data?.models)) {
    return {
      ok: true,
      source: "api",
      models: tags.data.models.map((model) => ({
        name: model.name,
        size: model.size || null,
        modifiedAt: model.modified_at || null,
        family: model.details?.family || null,
        parameterSize: model.details?.parameter_size || null,
        quantizationLevel: model.details?.quantization_level || null,
      })),
    };
  }

  const list = await commandOutput("ollama", ["ls"], { timeout: 10000 });
  if (list.exitCode !== 0) {
    return { ok: false, source: "none", models: [], error: tags.error || list.stderr || "Ollama models unavailable" };
  }

  return {
    ok: true,
    source: "cli",
    warning: "Ollama HTTP API is offline; showing models from `ollama ls`.",
    models: parseOllamaList(list.stdout),
  };
}

async function runAction(body) {
  const action = String(body?.action || "");
  const model = String(body?.model || "").trim();
  const confirmed = Boolean(body?.confirmed);
  const dryRun = Boolean(body?.dryRun);

  const actionMap = {
    "app-setup": { args: ["app-setup"], requiresConfirm: true, requiresModel: false },
    "app-use-model": { args: ["app-use-model", model], requiresConfirm: true, requiresModel: true },
    "app-restore": { args: ["app-restore"], requiresConfirm: true, requiresModel: false },
    "cli-config": { args: ["cli-config", model], requiresConfirm: false, requiresModel: true },
    "cli-restore": { args: ["cli-restore"], requiresConfirm: true, requiresModel: false },
    "pull-model": { args: ["pull-model", model], requiresConfirm: false, requiresModel: true },
    status: { args: ["status"], requiresConfirm: false, requiresModel: false },
    "list-models": { args: ["list-models"], requiresConfirm: false, requiresModel: false },
  };

  const spec = actionMap[action];
  if (!spec) {
    return { ok: false, error: `Unsupported action: ${action}` };
  }
  if (spec.requiresModel && !model) {
    return { ok: false, error: "Choose or enter a model first." };
  }
  if (spec.requiresConfirm && !dryRun && !confirmed) {
    return {
      ok: false,
      requiresConfirmation: true,
      error: "Confirm this action before running it. Codex App actions may restart Codex.",
    };
  }

  const wrapperArgs = dryRun ? ["--dry-run", ...spec.args] : spec.args;
  const result = await commandOutput("bash", [wrapper, ...wrapperArgs], { timeout: action === "pull-model" ? 900000 : 120000 });
  return {
    ok: result.exitCode === 0,
    command: printableCommand(["bash", wrapper, ...wrapperArgs]),
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function serveFile(res, requestedPath) {
  const normalized = normalize(requestedPath);
  const allowedRoots = [panelRoot, join(pluginRoot, "assets")];
  const allowed = allowedRoots.some((root) => {
    const rel = relative(root, normalized);
    return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
  });

  if (!allowed) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const fileStat = await stat(normalized);
    if (!fileStat.isFile()) {
      sendText(res, 404, "Not found");
      return;
    }
    const data = await readFile(normalized);
    res.writeHead(200, { "content-type": contentType(normalized) });
    res.end(data);
  } catch {
    sendText(res, 404, "Not found");
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--open") {
      parsed.open = true;
    } else if (arg === "--host") {
      parsed.host = argv[index + 1];
      index += 1;
    } else if (arg === "--port") {
      parsed.port = argv[index + 1];
      index += 1;
    } else if (arg === "-h" || arg === "--help") {
      console.log("Usage: ollama-codex-panel.mjs [--host 127.0.0.1] [--port 17841] [--open]");
      process.exit(0);
    } else {
      console.error(`[error] unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return parsed;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) {
      return { ok: false, status: response.status, error: `${response.status} ${response.statusText}` };
    }
    return { ok: true, data: await response.json() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function commandPath(name) {
  const result = await commandOutput("bash", ["-lc", `command -v ${name}`], { timeout: 5000 });
  return result.exitCode === 0 ? result.stdout.trim() : "";
}

async function commandOutput(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, {
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

async function readConfiguredModel(path) {
  try {
    const text = await readFile(path, "utf8");
    const match = text.match(/^model\s*=\s*"([^"]+)"/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function codexHome() {
  return process.env.CODEX_HOME || join(os.homedir(), ".codex");
}

function ollamaBaseUrl() {
  return (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");
}

function parseVersion(text) {
  return text.match(/([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] || null;
}

function semverGte(version, minimum) {
  const left = version.split(".").map((part) => Number(part));
  const right = minimum.split(".").map((part) => Number(part));
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] || 0) > (right[index] || 0)) return true;
    if ((left[index] || 0) < (right[index] || 0)) return false;
  }
  return true;
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
        size: parts[2] || "",
        modifiedAt: parts[3] || null,
        family: null,
        parameterSize: null,
        quantizationLevel: null,
      };
    })
    .filter((model) => model.name);
}

function printableCommand(parts) {
  return parts.map((part) => (part.includes(" ") ? JSON.stringify(part) : part)).join(" ");
}

function contentType(path) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8",
  };
  return types[extname(path)] || "application/octet-stream";
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

async function openUrl(url) {
  const platform = process.platform;
  if (platform === "darwin") {
    await commandOutput("open", [url]);
  } else if (platform === "win32") {
    await commandOutput("cmd", ["/c", "start", "", url]);
  } else {
    await commandOutput("xdg-open", [url]);
  }
}
