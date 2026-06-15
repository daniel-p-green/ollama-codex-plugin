#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_ID="ollama-codex@ollama-codex-local"
MCP_NAME="ollama_codex"

cd "$ROOT"

manifest_version() {
  python3 - <<'PY'
import json
from pathlib import Path

print(json.loads(Path("plugins/ollama-codex/.codex-plugin/plugin.json").read_text())["version"])
PY
}

installed_version() {
  codex plugin list --available --json | python3 -c '
import json
import sys

data = json.load(sys.stdin)
for plugin in data.get("installed", []):
    if plugin.get("pluginId") == "ollama-codex@ollama-codex-local":
        if not plugin.get("enabled"):
            raise SystemExit("installed plugin is not enabled")
        print(plugin.get("version", ""))
        break
else:
    raise SystemExit("ollama-codex plugin is not installed")
'
}

mcp_cache_path() {
  codex mcp get "$MCP_NAME" | python3 -c '
import re
import sys

text = sys.stdin.read()
match = re.search(r"^\s*cwd:\s*(.+?)\s*$", text, re.M)
if not match:
    raise SystemExit("could not find ollama_codex MCP cwd")
path = match.group(1)
if path.endswith("/."):
    path = path[:-2]
print(path)
'
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    printf '[error] missing file: %s\n' "$path" >&2
    return 1
  fi
}

expected_version="$(manifest_version)"

echo "== source validation =="
bash scripts/validate.sh

echo
echo "== installed plugin =="
actual_version="$(installed_version)"
if [[ "$actual_version" != "$expected_version" ]]; then
  printf '[error] installed version %s does not match manifest version %s\n' "$actual_version" "$expected_version" >&2
  printf '[info] run: codex plugin add %s\n' "$PLUGIN_ID" >&2
  exit 1
fi
printf '[ok] installed plugin version: %s\n' "$actual_version"

cache_path="$(mcp_cache_path)"
if [[ "$cache_path" != *"/$expected_version" ]]; then
  printf '[error] MCP cache path does not point at %s: %s\n' "$expected_version" "$cache_path" >&2
  exit 1
fi
printf '[ok] MCP cache path: %s\n' "$cache_path"

require_file "$cache_path/commands/ollama.md"
require_file "$cache_path/.codex-plugin/plugin.json"
require_file "$cache_path/mcp/server.mjs"
printf '[ok] installed short command: /ollama\n'

echo
echo "== installed-cache probes =="
PLUGIN_CWD="$cache_path" node scripts/probe-mcp.mjs
PLUGIN_CWD="$cache_path" node scripts/probe-widget-fixture.mjs

echo
echo "[ok] preflight passed"
echo "[next] Open a fresh Codex thread and run /ollama for live visual acceptance."
