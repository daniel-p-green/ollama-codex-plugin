#!/usr/bin/env bash
set -uo pipefail

MIN_OLLAMA_VERSION="0.24.0"
OLLAMA_HOST_URL="${OLLAMA_HOST:-http://127.0.0.1:11434}"
DRY_RUN=false

usage() {
  cat <<'USAGE'
Usage:
  ollama-codex.sh [--dry-run] status

  # Codex App
  ollama-codex.sh [--dry-run] app-setup
  ollama-codex.sh [--dry-run] app-use-model <model>
  ollama-codex.sh [--dry-run] app-restore

  # Codex CLI
  ollama-codex.sh [--dry-run] cli-setup
  ollama-codex.sh [--dry-run] cli-config <model>
  ollama-codex.sh [--dry-run] cli-restore
  ollama-codex.sh [--dry-run] cli-run [model]
  ollama-codex.sh [--dry-run] cli-run-model <model>
  ollama-codex.sh [--dry-run] cli-run-profile

  # Ollama model helpers
  ollama-codex.sh [--dry-run] list-models
  ollama-codex.sh [--dry-run] pull-model <model>

Backward-compatible aliases:
  setup              Alias for app-setup
  use-model <model>  Alias for app-use-model <model>
  restore            Alias for app-restore

Options:
  --dry-run          Print the command that would run without changing local state.
  -h, --help         Show this help.
USAGE
}

info() {
  printf '[info] %s\n' "$*"
}

ok() {
  printf '[ok] %s\n' "$*"
}

warn() {
  printf '[warn] %s\n' "$*" >&2
}

error() {
  printf '[error] %s\n' "$*" >&2
}

first_semver() {
  sed -nE 's/.*([0-9]+[.][0-9]+[.][0-9]+).*/\1/p' | head -n 1
}

semver_ge() {
  local version="$1"
  local minimum="$2"
  local version_major version_minor version_patch minimum_major minimum_minor minimum_patch

  IFS=. read -r version_major version_minor version_patch <<<"$version"
  IFS=. read -r minimum_major minimum_minor minimum_patch <<<"$minimum"

  version_major=${version_major:-0}
  version_minor=${version_minor:-0}
  version_patch=${version_patch:-0}
  minimum_major=${minimum_major:-0}
  minimum_minor=${minimum_minor:-0}
  minimum_patch=${minimum_patch:-0}

  if (( version_major > minimum_major )); then return 0; fi
  if (( version_major < minimum_major )); then return 1; fi
  if (( version_minor > minimum_minor )); then return 0; fi
  if (( version_minor < minimum_minor )); then return 1; fi
  (( version_patch >= minimum_patch ))
}

ollama_path() {
  command -v ollama 2>/dev/null || true
}

codex_path() {
  command -v codex 2>/dev/null || true
}

ollama_version() {
  ollama --version 2>&1 | first_semver
}

print_file_status() {
  local label="$1"
  local path="$2"

  if [[ -e "$path" ]]; then
    ok "$label: $path"
  else
    info "$label: not found at $path"
  fi
}

codex_home() {
  printf '%s\n' "${CODEX_HOME:-$HOME/.codex}"
}

codex_cli_config_path() {
  printf '%s/ollama-launch.config.toml\n' "$(codex_home)"
}

codex_cli_catalog_path() {
  printf '%s/model.json\n' "$(codex_home)"
}

ollama_openai_base_url() {
  local host="${OLLAMA_HOST_URL%/}"
  case "$host" in
    */v1)
      printf '%s/\n' "$host"
      ;;
    *)
      printf '%s/v1/\n' "$host"
      ;;
  esac
}

require_interactive_terminal() {
  local command_label="$1"

  if [[ "$DRY_RUN" == "true" ]]; then
    return 0
  fi
  if [[ "${OLLAMA_CODEX_ALLOW_INTERACTIVE:-}" == "1" ]]; then
    return 0
  fi
  if [[ -t 0 && -t 1 ]]; then
    return 0
  fi

  error "$command_label launches an interactive Codex CLI session."
  error "Run this from a real terminal, or set OLLAMA_CODEX_ALLOW_INTERACTIVE=1 if you intentionally want nested Codex."
  return 1
}

escape_basic_string() {
  local value="$1"
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/\\r}
  value=${value//$'\t'/\\t}
  printf '%s' "$value"
}

write_cli_config() {
  local model="$1"
  local config_path
  local catalog_path
  local base_url
  local escaped_model
  local escaped_catalog_path
  local escaped_base_url

  config_path="$(codex_cli_config_path)"
  catalog_path="$(codex_cli_catalog_path)"
  base_url="$(ollama_openai_base_url)"

  if [[ "$DRY_RUN" == "true" ]]; then
    info "would write Codex CLI profile: $config_path"
    info "would write Codex CLI model catalog: $catalog_path"
    info "model: $model"
    info "base URL: $base_url"
    return 0
  fi

  mkdir -p "$(dirname "$config_path")"

  escaped_model="$(escape_basic_string "$model")"
  escaped_catalog_path="$(escape_basic_string "$catalog_path")"
  escaped_base_url="$(escape_basic_string "$base_url")"

  {
    printf 'model = "%s"\n' "$escaped_model"
    printf 'model_provider = "ollama-launch"\n'
    printf 'model_catalog_json = "%s"\n' "$escaped_catalog_path"
    printf '\n'
    printf '[model_providers.ollama-launch]\n'
    printf 'name = "Ollama"\n'
    printf 'base_url = "%s"\n' "$escaped_base_url"
    printf 'wire_api = "responses"\n'
  } >"$config_path"

  {
    printf '{\n'
    printf '  "models": [\n'
    printf '    {\n'
    printf '      "slug": "%s",\n' "$escaped_model"
    printf '      "display_name": "%s",\n' "$escaped_model"
    printf '      "base_instructions": "",\n'
    printf '      "context_window": 131072,\n'
    printf '      "default_verbosity": "low",\n'
    printf '      "experimental_supported_tools": [],\n'
    printf '      "input_modalities": [\n'
    printf '        "text"\n'
    printf '      ],\n'
    printf '      "priority": 0,\n'
    printf '      "shell_type": "default",\n'
    printf '      "support_verbosity": true,\n'
    printf '      "supported_in_api": true,\n'
    printf '      "supported_reasoning_levels": [],\n'
    printf '      "supports_parallel_tool_calls": false,\n'
    printf '      "supports_reasoning_summaries": false,\n'
    printf '      "truncation_policy": {\n'
    printf '        "limit": 10000,\n'
    printf '        "mode": "bytes"\n'
    printf '      },\n'
    printf '      "visibility": "list"\n'
    printf '    }\n'
    printf '  ]\n'
    printf '}\n'
  } >"$catalog_path"

  ok "Codex CLI Ollama profile written: $config_path"
  ok "Codex CLI Ollama model catalog written: $catalog_path"
}

print_model_summary() {
  if ! command -v ollama >/dev/null 2>&1; then
    return 0
  fi

  local model_output
  model_output="$(ollama ls 2>/dev/null || true)"
  if [[ -z "$model_output" ]]; then
    warn "ollama models: unavailable; start Ollama or run 'ollama pull <model>'"
    return 0
  fi

  local model_count
  model_count="$(printf '%s\n' "$model_output" | awk 'NR > 1 && NF > 0 { count++ } END { print count + 0 }')"
  ok "ollama local models: $model_count installed"
  if (( model_count > 0 )); then
    printf '%s\n' "$model_output" | sed -n '1,6p'
    if (( model_count > 5 )); then
      info "showing first 5 models; run 'ollama-codex.sh list-models' for the full list"
    fi
  fi
}

print_status() {
  printf 'Ollama for Codex status\n'
  printf '\n'

  local ollama_bin
  ollama_bin="$(ollama_path)"
  if [[ -n "$ollama_bin" ]]; then
    ok "ollama executable: $ollama_bin"
    local version
    version="$(ollama_version || true)"
    if [[ -n "$version" ]]; then
      if semver_ge "$version" "$MIN_OLLAMA_VERSION"; then
        ok "ollama version: $version (minimum $MIN_OLLAMA_VERSION)"
      else
        warn "ollama version: $version (minimum $MIN_OLLAMA_VERSION required for Codex App support)"
      fi
    else
      warn "ollama version: unable to parse version from 'ollama --version'"
    fi
  else
    warn "ollama executable: not found in PATH"
  fi

  if command -v curl >/dev/null 2>&1; then
    local server_payload
    server_payload="$(curl -fsS --max-time 2 "${OLLAMA_HOST_URL%/}/api/version" 2>/dev/null || true)"
    if [[ -n "$server_payload" ]]; then
      ok "ollama HTTP API: reachable at $OLLAMA_HOST_URL"
      info "server response: $server_payload"
    else
      warn "ollama HTTP API: not reachable at $OLLAMA_HOST_URL"
    fi
  else
    warn "ollama HTTP API: curl is not available, skipped reachability check"
  fi

  print_model_summary

  local codex_bin
  codex_bin="$(codex_path)"
  if [[ -n "$codex_bin" ]]; then
    ok "codex executable: $codex_bin"
    local codex_version
    codex_version="$(codex --version 2>&1 | head -n 1 || true)"
    if [[ -n "$codex_version" ]]; then
      info "codex version: $codex_version"
    fi
  else
    warn "codex executable: not found in PATH"
  fi

  print_file_status "Codex CLI Ollama profile" "$(codex_cli_config_path)"
  print_file_status "Codex CLI Ollama model catalog" "$(codex_cli_catalog_path)"
  print_file_status "Codex App Ollama backups" "$HOME/.ollama/backup/codex-app"
  printf '\n'
  info "Codex CLI works best with models configured for at least a 64k context window."
}

require_ollama() {
  local ollama_bin
  ollama_bin="$(ollama_path)"
  if [[ -z "$ollama_bin" ]]; then
    error "ollama is not installed or not in PATH."
    return 1
  fi

  local version
  version="$(ollama_version || true)"
  if [[ -z "$version" ]]; then
    error "unable to determine Ollama version."
    return 1
  fi
  if ! semver_ge "$version" "$MIN_OLLAMA_VERSION"; then
    error "Ollama $MIN_OLLAMA_VERSION or newer is required for Codex App support. Found $version."
    return 1
  fi
}

require_codex() {
  local codex_bin
  codex_bin="$(codex_path)"
  if [[ -z "$codex_bin" ]]; then
    error "codex is not installed or not in PATH."
    return 1
  fi
}

ensure_ollama() {
  if [[ "$DRY_RUN" == "true" ]]; then
    return 0
  fi
  require_ollama
}

ensure_codex() {
  if [[ "$DRY_RUN" == "true" ]]; then
    return 0
  fi
  require_codex
}

run_or_print() {
  if [[ "$DRY_RUN" == "true" ]]; then
    printf '+'
    printf ' %q' "$@"
    printf '\n'
    return 0
  fi
  "$@"
}

require_exact_args() {
  local command_label="$1"
  local expected_count="$2"
  local actual_count="$3"

  if [[ "$actual_count" -ne "$expected_count" ]]; then
    error "$command_label requires exactly $expected_count argument(s)."
    usage
    exit 2
  fi
}

require_no_args() {
  local command_label="$1"
  local actual_count="$2"

  if [[ "$actual_count" -ne 0 ]]; then
    error "$command_label does not accept extra arguments."
    usage
    exit 2
  fi
}

args=()
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      args+=("$arg")
      ;;
  esac
done

set -- "${args[@]}"
command_name="${1:-status}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "$command_name" in
  status)
    require_no_args "$command_name" "$#"
    print_status
    ;;
  setup|app-setup)
    require_no_args "$command_name" "$#"
    ensure_ollama || exit 1
    run_or_print ollama launch codex-app
    ;;
  use-model|app-use-model)
    require_exact_args "$command_name" 1 "$#"
    ensure_ollama || exit 1
    run_or_print ollama launch codex-app --model "$1"
    ;;
  restore|app-restore)
    require_no_args "$command_name" "$#"
    ensure_ollama || exit 1
    run_or_print ollama launch codex-app --restore
    ;;
  cli-setup)
    require_no_args "$command_name" "$#"
    ensure_ollama || exit 1
    ensure_codex || exit 1
    require_interactive_terminal "$command_name" || exit 1
    run_or_print ollama launch codex
    ;;
  cli-config)
    require_exact_args "$command_name" 1 "$#"
    ensure_ollama || exit 1
    ensure_codex || exit 1
    write_cli_config "$1"
    ;;
  cli-restore)
    require_no_args "$command_name" "$#"
    ensure_ollama || exit 1
    run_or_print ollama launch codex --restore
    ;;
  cli-run)
    if [[ $# -gt 1 ]]; then
      error "cli-run accepts zero arguments or one model name."
      usage
      exit 2
    fi
    ensure_codex || exit 1
    require_interactive_terminal "$command_name" || exit 1
    if [[ $# -eq 1 ]]; then
      run_or_print codex --oss -m "$1"
    else
      run_or_print codex --oss
    fi
    ;;
  cli-run-model)
    require_exact_args "$command_name" 1 "$#"
    ensure_codex || exit 1
    require_interactive_terminal "$command_name" || exit 1
    run_or_print codex --oss -m "$1"
    ;;
  cli-run-profile)
    require_no_args "$command_name" "$#"
    ensure_codex || exit 1
    require_interactive_terminal "$command_name" || exit 1
    run_or_print codex --profile ollama-launch
    ;;
  list-models)
    require_no_args "$command_name" "$#"
    ensure_ollama || exit 1
    run_or_print ollama ls
    ;;
  pull-model)
    require_exact_args "$command_name" 1 "$#"
    ensure_ollama || exit 1
    run_or_print ollama pull "$1"
    ;;
  *)
    error "unknown command: $command_name"
    usage
    exit 2
    ;;
esac
