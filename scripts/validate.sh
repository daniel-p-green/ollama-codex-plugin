#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WRAPPER="$ROOT/plugins/ollama-codex/scripts/ollama-codex.sh"

cd "$ROOT"

python3 scripts/validate-plugin.py
bash -n "$WRAPPER"

dry_run() {
  bash "$WRAPPER" --dry-run "$@" >/dev/null
}

dry_run app-setup
dry_run app-use-model gemma4:31b
dry_run app-restore
dry_run setup
dry_run use-model gemma4:31b
dry_run restore
dry_run cli-setup
dry_run cli-config gpt-oss:20b
dry_run cli-restore
dry_run cli-run
dry_run cli-run-model gpt-oss:120b
dry_run cli-run gpt-oss:120b-cloud
dry_run cli-run-profile
dry_run list-models
dry_run pull-model gemma4:31b

echo "[ok] shell syntax and dry-run smoke tests"
