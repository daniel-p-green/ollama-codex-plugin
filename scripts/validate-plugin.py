#!/usr/bin/env python3
"""Validate the Ollama Codex plugin package without Codex-only dependencies."""

from __future__ import annotations

import json
import re
import stat
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugins" / "ollama-codex"
MANIFEST = PLUGIN / ".codex-plugin" / "plugin.json"
MARKETPLACE = ROOT / ".agents" / "plugins" / "marketplace.json"
WRAPPER = PLUGIN / "scripts" / "ollama-codex.sh"
MCP_CONFIG = PLUGIN / ".mcp.json"
MCP_SERVER = PLUGIN / "mcp" / "server.mjs"
DEMO_SCRIPT = ROOT / "scripts" / "demo.sh"
WIDGET_FIXTURE_PROBE = ROOT / "scripts" / "probe-widget-fixture.mjs"
WIDGET_PROOF_RENDERER = ROOT / "scripts" / "render-widget-proof.mjs"

EXPECTED_COMMANDS = {
    "ollama-codex-status.md",
    "ollama-codex-panel.md",
    "ollama-codex-list-models.md",
    "ollama-codex-pull-model.md",
    "ollama-codex-app-setup.md",
    "ollama-codex-app-use-model.md",
    "ollama-codex-app-use-codex-model.md",
    "ollama-codex-app-restore.md",
    "ollama-codex-setup.md",
    "ollama-codex-use-model.md",
    "ollama-codex-restore.md",
    "ollama-codex-cli-setup.md",
    "ollama-codex-cli-config.md",
    "ollama-codex-cli-run.md",
    "ollama-codex-cli-run-model.md",
    "ollama-codex-cli-run-profile.md",
    "ollama-codex-cli-restore.md",
}


def fail(message: str) -> None:
    print(f"[error] {message}", file=sys.stderr)
    raise SystemExit(1)


def ok(message: str) -> None:
    print(f"[ok] {message}")


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except Exception as exc:  # pragma: no cover - diagnostic path
        fail(f"invalid JSON at {path}: {exc}")


def require_file(path: Path) -> None:
    if not path.is_file():
        fail(f"missing file: {path.relative_to(ROOT)}")


def require_dir(path: Path) -> None:
    if not path.is_dir():
        fail(f"missing directory: {path.relative_to(ROOT)}")


def frontmatter(path: Path) -> str:
    text = path.read_text()
    if not text.startswith("---\n"):
        fail(f"missing frontmatter: {path.relative_to(ROOT)}")
    end = text.find("\n---\n", 4)
    if end == -1:
        fail(f"unterminated frontmatter: {path.relative_to(ROOT)}")
    body = text[end + 5 :].strip()
    if not body:
        fail(f"empty body: {path.relative_to(ROOT)}")
    return text[4:end]


def validate_marketplace() -> None:
    require_file(MARKETPLACE)
    data = load_json(MARKETPLACE)
    if data.get("name") != "ollama-codex-local":
        fail("marketplace name must be ollama-codex-local")
    plugins = data.get("plugins")
    if not isinstance(plugins, list) or len(plugins) != 1:
        fail("marketplace must contain exactly one plugin")
    plugin = plugins[0]
    if plugin.get("name") != "ollama-codex":
        fail("marketplace plugin name must be ollama-codex")
    source = plugin.get("source", {})
    if source.get("source") != "local":
        fail("marketplace plugin source must be local")
    expected_path = "./plugins/ollama-codex"
    if source.get("path") != expected_path:
        fail(f"marketplace plugin path must be {expected_path}")
    ok("marketplace metadata")


def validate_manifest() -> None:
    require_file(MANIFEST)
    data = load_json(MANIFEST)
    if data.get("name") != "ollama-codex":
        fail("plugin manifest name must be ollama-codex")
    if not re.match(r"^\d+\.\d+\.\d+(\+[A-Za-z0-9.-]+)?$", data.get("version", "")):
        fail("plugin version must be semver with optional build metadata")
    interface = data.get("interface")
    if not isinstance(interface, dict):
        fail("plugin manifest must include interface metadata")
    for key in ("displayName", "shortDescription", "longDescription", "category", "composerIcon", "logo"):
        if not interface.get(key):
            fail(f"plugin interface missing {key}")
    prompts = interface.get("defaultPrompt")
    if not isinstance(prompts, list) or len(prompts) != 3:
        fail("plugin interface must include exactly three starter prompts")
    for asset_key in ("composerIcon", "logo"):
        asset = PLUGIN / interface[asset_key]
        require_file(asset)
    if "Codex CLI" not in data.get("description", ""):
        fail("plugin description must cover Codex CLI")
    if data.get("mcpServers") != "./.mcp.json":
        fail("plugin manifest must declare mcpServers")
    if "control panel" not in interface.get("longDescription", ""):
        fail("plugin longDescription must describe the visual control panel")
    ok("plugin manifest")


def validate_commands() -> None:
    commands_dir = PLUGIN / "commands"
    require_dir(commands_dir)
    found = {path.name for path in commands_dir.glob("*.md")}
    missing = sorted(EXPECTED_COMMANDS - found)
    if missing:
        fail(f"missing commands: {', '.join(missing)}")
    for path in sorted(commands_dir.glob("*.md")):
        fm = frontmatter(path)
        if "description:" not in fm:
            fail(f"command missing description: {path.relative_to(ROOT)}")
    ok(f"commands ({len(found)})")


def validate_skill() -> None:
    skill = PLUGIN / "skills" / "configure-codex-with-ollama" / "SKILL.md"
    require_file(skill)
    fm = frontmatter(skill)
    if "name: configure-codex-with-ollama" not in fm:
        fail("skill frontmatter has wrong name")
    if "This skill should be used when" not in fm:
        fail("skill description must use third-person trigger phrasing")
    text = skill.read_text()
    for required in ("panel", "app-setup", "cli-config", "cli-run-model", "cli-restore"):
        if required not in text:
            fail(f"skill missing workflow: {required}")
    ok("skill metadata and routing")


def validate_wrapper() -> None:
    require_file(WRAPPER)
    require_file(DEMO_SCRIPT)
    require_file(WIDGET_FIXTURE_PROBE)
    require_file(WIDGET_PROOF_RENDERER)
    mode = WRAPPER.stat().st_mode
    if not (mode & stat.S_IXUSR):
        fail("wrapper script must be executable")
    demo_mode = DEMO_SCRIPT.stat().st_mode
    if not (demo_mode & stat.S_IXUSR):
        fail("demo script must be executable")
    fixture_mode = WIDGET_FIXTURE_PROBE.stat().st_mode
    if not (fixture_mode & stat.S_IXUSR):
        fail("widget fixture probe must be executable")
    proof_mode = WIDGET_PROOF_RENDERER.stat().st_mode
    if not (proof_mode & stat.S_IXUSR):
        fail("widget proof renderer must be executable")
    text = WRAPPER.read_text()
    for command in (
        "app-setup",
        "app-use-model",
        "app-use-codex-model",
        "app-restore",
        "cli-setup",
        "cli-config",
        "cli-run-model",
        "cli-run-profile",
        "cli-restore",
        "list-models",
        "pull-model",
    ):
        if command not in text:
            fail(f"wrapper missing command: {command}")
    ok("wrapper command surface")


def validate_panel() -> None:
    require_file(MCP_CONFIG)
    require_file(MCP_SERVER)
    mcp = load_json(MCP_CONFIG)
    server = mcp.get("mcpServers", {}).get("ollama_codex")
    if not isinstance(server, dict):
        fail(".mcp.json must register ollama_codex server")
    if server.get("command") != "npx":
        fail("ollama-codex MCP server should start through npx dependency pins")
    args = server.get("args", [])
    for required in ("@modelcontextprotocol/sdk@1.29.0", "zod@4.4.2", "./mcp/server.mjs"):
        if required not in args:
            fail(f".mcp.json missing MCP dependency/entrypoint: {required}")
    server_text = MCP_SERVER.read_text()
    for required in (
        "render_ollama_codex_panel",
        "ollama_codex_action",
        "ui://widget/ollama-codex-control-panel.html",
        "text/html;profile=mcp-app",
        "ext-apps-app-with-deps.js",
        "assets\", \"logo.svg",
        "svgDataUri",
        "codexConfigPayload",
        "recommendationPayload",
        "model-recommendations.json",
        "currentCodexModel",
        "previousCodexModel",
        "latestCodexAppBackupPayload",
        "codexModelsPayload",
        "models_cache.json",
        "codexModelCount",
        "packageVersion",
        "supportsNativeCodexSwitch",
    ):
        if required not in server_text:
            fail(f"MCP server missing: {required}")
    for path in (
        PLUGIN / "mcp" / "widget-assets" / "control-panel" / "widget.html",
        PLUGIN / "mcp" / "widget-assets" / "control-panel" / "widget.css",
        PLUGIN / "mcp" / "widget-assets" / "control-panel" / "widget.js",
        PLUGIN / "mcp" / "vendor" / "ext-apps-app-with-deps.js",
    ):
        require_file(path)
    html = (PLUGIN / "mcp" / "widget-assets" / "control-panel" / "widget.html").read_text()
    js = (PLUGIN / "mcp" / "widget-assets" / "control-panel" / "widget.js").read_text()
    css = (PLUGIN / "mcp" / "widget-assets" / "control-panel" / "widget.css").read_text()
    for required in ("Ollama for Codex control panel", "__OLLAMA_CODEX_WIDGET_CSS__", "__OLLAMA_CODEX_WIDGET_JS__"):
        if required not in html:
            fail(f"widget HTML missing: {required}")
    for required in (
        "ollama_codex_status",
        "ollama_codex_models",
        "ollama_codex_action",
        "app-use-model",
        "app-use-codex-model",
        "cli-config",
        "__OLLAMA_CODEX_LOGO_DATA_URI__",
        "FALLBACK_RECOMMENDATIONS",
        "renderCodexModels",
        "Recommended for Codex",
        "Codex/OpenAI models",
        "Codex/OpenAI and Ollama models are visible together",
        "One active provider profile at a time",
        "data-use-codex-model",
        "versionLabel",
        "native Codex switching enabled",
        "supportsNativeCodexSwitch",
        "Switches back to Codex/OpenAI",
        "visibleCodexModels",
        "codexModelDescription",
        "currentUsesOllama",
        "modelBadges",
        "Configured",
        "badge(",
        "Search Codex or Ollama models",
        "Use any Ollama tag",
        "custom-model",
        "filteredModels",
        "sectionLabel",
        "Installed",
        "data-use-model",
        "kimi-k2.6:cloud",
        "Switch",
        "confirmedOverride",
        "confirmed: Boolean(confirmedOverride)",
        'runAction("pull-model", false, undefined, true)',
        "errorMessage(error)",
        "result-panel",
        "Command result",
    ):
        if required not in js:
            fail(f"widget JS missing: {required}")
    for removed in ("confirmInput", "confirmed: false"):
        if removed in js:
            fail(f"widget JS contains stale confirmation UI: {removed}")
    if "data:image/svg+xml,%3Csvg" in js:
        fail("widget JS must not embed the old generic logo")
    for stale_color in ("#fffdfa", "#ded6ca", "#f4efe7", "#f8f4ea"):
        if stale_color in css:
            fail(f"widget CSS contains stale beige palette color: {stale_color}")
    for required in (".model-use", ".model.selected", ".model-group", ".badge", ".model.active", ".count", 'input[type="search"]'):
        if required not in css:
            fail(f"widget CSS missing model switcher style: {required}")
    fixture_text = WIDGET_FIXTURE_PROBE.read_text()
    proof_text = WIDGET_PROOF_RENDERER.read_text()
    for required in ("packageVersion", "supportsNativeCodexSwitch", "GPT-5.5", "gpt-oss:20b", "kimi-k2.6:cloud"):
        if required not in proof_text:
            fail(f"widget proof renderer missing: {required}")
    for required in ("OpenAI/Codex profile is active", "Codex/OpenAI models", "GPT-5.4", "Switches back to Codex/OpenAI", "data-use-codex-model", "filterText", "Installed", "local-gpt-oss", "widget fixture probe"):
        if required not in fixture_text:
            fail(f"widget fixture probe missing: {required}")
    ok("in-Codex visual control panel")


def validate_docs() -> None:
    for path in (
        ROOT / "README.md",
        ROOT / "docs" / "demo.md",
        ROOT / "docs" / "share.md",
        ROOT / "docs" / "romain-ready.md",
        ROOT / "CHANGELOG.md",
        ROOT / "LICENSE",
    ):
        require_file(path)
    readme = (ROOT / "README.md").read_text()
    for required in (
        "plugins/ollama-codex/assets/logo.svg",
        "actions/workflows/validate.yml/badge.svg",
        "30-Second Install",
        "/ollama-codex-panel",
        "docs/romain-ready.md",
        "The missing visual model switcher for Ollama in the Codex Mac app",
        "Ollama can already work with Codex",
        "the easiest visual way to make Codex/OpenAI and Ollama model options available together in Codex",
        "inside the Codex Mac app chat",
        "does not replace Codex's built-in OpenAI model selector",
        "one active provider profile at a time",
        "app-use-codex-model",
        "timestamped backup",
        "Codex/OpenAI models and Ollama models visible at the same time",
        "actual Codex/OpenAI model catalog",
        "see the active Codex/OpenAI profile and Ollama options side by side",
        "Active and configured badges",
        "Deduplicated model rows",
        "Direct non-dry-run MCP calls still require a confirmation flag",
    ):
        if required not in readme:
            fail(f"README missing Romain-ready marker: {required}")
    ok("public docs")


def validate_references() -> None:
    reference = PLUGIN / "references" / "ollama-codex-docs.md"
    require_file(reference)
    text = reference.read_text()
    for required in (
        "https://docs.ollama.com/integrations/codex-app",
        "https://docs.ollama.com/integrations/codex",
        "ollama launch codex-app --restore",
        "ollama launch codex --config",
        "codex --oss -m gpt-oss:120b-cloud",
    ):
        if required not in text:
            fail(f"reference missing: {required}")
    ok("official docs reference")


def validate_repo_hygiene() -> None:
    ignored_names = {
        line.strip()
        for line in (ROOT / ".gitignore").read_text().splitlines()
        if line.strip() and not line.strip().startswith("#")
    }
    for path in ROOT.rglob(".DS_Store"):
        if ".git" not in path.parts:
            if path == ROOT / ".DS_Store" and ".DS_Store" in ignored_names:
                continue
            fail(f"remove .DS_Store: {path.relative_to(ROOT)}")
    local_path_pattern = re.compile(r"/Users/[A-Za-z0-9._-]+/")
    for path in PLUGIN.rglob("*"):
        if path.is_file() and local_path_pattern.search(path.read_text(errors="ignore")):
            fail(f"plugin package contains local absolute path: {path.relative_to(ROOT)}")
    ok("repo hygiene")


def main() -> None:
    validate_marketplace()
    validate_manifest()
    validate_commands()
    validate_skill()
    validate_wrapper()
    validate_panel()
    validate_docs()
    validate_references()
    validate_repo_hygiene()
    ok("all plugin checks passed")


if __name__ == "__main__":
    main()
