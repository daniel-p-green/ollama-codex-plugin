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
DEMO_SCRIPT = ROOT / "scripts" / "demo.sh"

EXPECTED_COMMANDS = {
    "ollama-codex-status.md",
    "ollama-codex-list-models.md",
    "ollama-codex-pull-model.md",
    "ollama-codex-app-setup.md",
    "ollama-codex-app-use-model.md",
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
    if not isinstance(prompts, list) or len(prompts) < 5:
        fail("plugin interface must include production starter prompts")
    for asset_key in ("composerIcon", "logo"):
        asset = PLUGIN / interface[asset_key]
        require_file(asset)
    if "Codex CLI" not in data.get("description", ""):
        fail("plugin description must cover Codex CLI")
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
    for required in ("app-setup", "cli-config", "cli-run-model", "cli-restore"):
        if required not in text:
            fail(f"skill missing workflow: {required}")
    ok("skill metadata and routing")


def validate_wrapper() -> None:
    require_file(WRAPPER)
    require_file(DEMO_SCRIPT)
    mode = WRAPPER.stat().st_mode
    if not (mode & stat.S_IXUSR):
        fail("wrapper script must be executable")
    demo_mode = DEMO_SCRIPT.stat().st_mode
    if not (demo_mode & stat.S_IXUSR):
        fail("demo script must be executable")
    text = WRAPPER.read_text()
    for command in (
        "app-setup",
        "app-use-model",
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
        "docs/romain-ready.md",
        "The missing Codex plugin GUI for Ollama",
        "Ollama can already work with Codex",
        "the easiest visual way to enable, use, and safely switch back from Ollama options in Codex",
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
    for path in ROOT.rglob(".DS_Store"):
        if ".git" not in path.parts:
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
    validate_docs()
    validate_references()
    validate_repo_hygiene()
    ok("all plugin checks passed")


if __name__ == "__main__":
    main()
