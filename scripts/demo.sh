#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WRAPPER="$ROOT/plugins/ollama-codex/scripts/ollama-codex.sh"

cd "$ROOT"

echo "== validate package =="
bash scripts/validate.sh

echo
echo "== local readiness =="
bash "$WRAPPER" status

echo
echo "== visual panel dry run =="
bash "$WRAPPER" --dry-run panel --port 17841

echo
echo "== safe App dry runs =="
bash "$WRAPPER" --dry-run app-setup
bash "$WRAPPER" --dry-run app-use-model gemma4:31b
bash "$WRAPPER" --dry-run app-use-model kimi-k2.6:cloud
bash "$WRAPPER" --dry-run app-restore

echo
echo "== safe CLI dry runs =="
bash "$WRAPPER" --dry-run cli-setup
bash "$WRAPPER" --dry-run cli-config gpt-oss:20b
bash "$WRAPPER" --dry-run cli-run
bash "$WRAPPER" --dry-run cli-run-model gpt-oss:120b
bash "$WRAPPER" --dry-run cli-run-model gpt-oss:120b-cloud
bash "$WRAPPER" --dry-run cli-run-profile
bash "$WRAPPER" --dry-run cli-restore

echo
echo "== safe model helper dry runs =="
bash "$WRAPPER" --dry-run list-models
bash "$WRAPPER" --dry-run pull-model gemma4:31b
