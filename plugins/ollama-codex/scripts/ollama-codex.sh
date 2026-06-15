#!/usr/bin/env bash
set -uo pipefail

MIN_OLLAMA_VERSION="0.24.0"
OLLAMA_HOST_URL="${OLLAMA_HOST:-http://127.0.0.1:11434}"
DRY_RUN=false

usage() {
  cat <<'USAGE'
Usage:
  ollama-codex.sh [--dry-run] doctor
  ollama-codex.sh [--dry-run] status

  # Codex App
  ollama-codex.sh [--dry-run] app-setup
  ollama-codex.sh [--dry-run] app-use-model <model>
  ollama-codex.sh [--dry-run] app-use-codex-model <model>
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

plugin_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/.." && pwd
}

plugin_version() {
  local root
  root="$(plugin_root)"
  sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' "$root/.codex-plugin/plugin.json" 2>/dev/null | head -n 1
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

codex_app_config_path() {
  printf '%s/config.toml\n' "$(codex_home)"
}

codex_models_cache_path() {
  printf '%s/models_cache.json\n' "$(codex_home)"
}

codex_app_backup_dir() {
  printf '%s/.ollama/backup/codex-app\n' "$HOME"
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

codex_config_top_level_value() {
  local key="$1"
  local path="$2"

  awk -v key="$key" '
    /^[[:space:]]*\[/ { exit }
    $0 ~ "^[[:space:]]*" key "[[:space:]]*=" {
      value=$0
      sub("^[^\"]*\"", "", value)
      sub("\".*$", "", value)
      print value
      exit
    }
  ' "$path" 2>/dev/null
}

codex_model_is_known() {
  local model="$1"
  local catalog_path

  catalog_path="$(codex_models_cache_path)"
  [[ -f "$catalog_path" ]] || return 0
  grep -Fq "\"slug\":\"$model\"" "$catalog_path" && return 0
  grep -Fq "\"slug\": \"$model\"" "$catalog_path" && return 0
  return 1
}

backup_codex_app_config() {
  local config_path="$1"
  local backup_dir
  local backup_path

  [[ -f "$config_path" ]] || return 0
  backup_dir="$(codex_app_backup_dir)"
  backup_path="$backup_dir/plugin-config.toml.$(date +%s)"
  mkdir -p "$backup_dir"
  if cp "$config_path" "$backup_path"; then
    ok "Codex App config backup written: $backup_path"
  else
    error "unable to back up Codex App config to $backup_path"
    return 1
  fi
}

write_codex_openai_model_config() {
  local model="$1"
  local config_path
  local tmp_path
  local escaped_model

  config_path="$(codex_app_config_path)"
  tmp_path="$config_path.tmp.$$"
  escaped_model="$(escape_basic_string "$model")"
  mkdir -p "$(dirname "$config_path")"

  if [[ -f "$config_path" ]]; then
    awk -v model="$escaped_model" '
      BEGIN {
        wrote_model = 0
        in_top = 1
        skip_ollama_provider = 0
      }
      function write_model_once() {
        if (!wrote_model) {
          print "model = \"" model "\""
          wrote_model = 1
        }
      }
      /^[[:space:]]*\[model_providers\.ollama-launch-codex-app\][[:space:]]*$/ {
        skip_ollama_provider = 1
        next
      }
      skip_ollama_provider && /^[[:space:]]*\[/ {
        skip_ollama_provider = 0
      }
      skip_ollama_provider {
        next
      }
      in_top && /^[[:space:]]*\[/ {
        write_model_once()
        in_top = 0
      }
      in_top && /^[[:space:]]*model[[:space:]]*=/ {
        write_model_once()
        next
      }
      in_top && /^[[:space:]]*model_provider[[:space:]]*=/ {
        next
      }
      in_top && /^[[:space:]]*model_catalog_json[[:space:]]*=/ {
        next
      }
      {
        print
      }
      END {
        if (in_top) {
          write_model_once()
        }
      }
    ' "$config_path" >"$tmp_path"
  else
    printf 'model = "%s"\n' "$escaped_model" >"$tmp_path"
  fi

  mv "$tmp_path" "$config_path"
  ok "Codex App native model set: $model"
}

use_codex_openai_model() {
  local model="$1"
  local config_path
  local current_provider

  config_path="$(codex_app_config_path)"
  current_provider="$(codex_config_top_level_value "model_provider" "$config_path")"

  if [[ "$DRY_RUN" == "true" ]]; then
    if [[ "$current_provider" == "ollama-launch-codex-app" ]]; then
      printf '+ ollama launch codex-app --restore --yes\n'
    fi
    info "would back up Codex App config: $config_path"
    info "would set Codex App native OpenAI model: $model"
    info "would remove top-level Ollama provider pointers from Codex App config"
    return 0
  fi

  if ! codex_model_is_known "$model"; then
    error "Codex/OpenAI model not found in $(codex_models_cache_path): $model"
    error "Refresh Codex's native model catalog or choose a visible Codex/OpenAI row from the panel."
    return 1
  fi

  backup_codex_app_config "$config_path"

  if [[ "$current_provider" == "ollama-launch-codex-app" ]]; then
    if command -v ollama >/dev/null 2>&1; then
      if ! ollama launch codex-app --restore --yes; then
        warn "ollama restore failed; continuing with direct Codex config switch to OpenAI provider"
      fi
    else
      warn "ollama executable not found; falling back to direct Codex config restore to OpenAI provider"
    fi
  fi

  write_codex_openai_model_config "$model"
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
    codex_version="$(codex --version 2>&1 | awk '/^codex-cli[[:space:]]/ { print; found=1; exit } END { if (!found) exit 1 }' || true)"
    if [[ -n "$codex_version" ]]; then
      info "codex version: $codex_version"
    else
      warn "codex version: unable to parse version from 'codex --version'"
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

print_doctor() {
  local root
  local version
  root="$(plugin_root)"
  version="$(plugin_version)"

  printf 'Ollama for Codex doctor\n'
  printf '\n'
  ok "plugin root: $root"
  if [[ -n "$version" ]]; then
    ok "plugin version: $version"
  else
    warn "plugin version: unable to read .codex-plugin/plugin.json"
  fi

  print_file_status "short /ollama command" "$root/commands/ollama.md"
  print_file_status "visual panel command" "$root/commands/ollama-codex-panel.md"
  print_file_status "MCP server config" "$root/.mcp.json"
  print_file_status "MCP server implementation" "$root/mcp/server.mjs"

  if command -v codex >/dev/null 2>&1; then
    local mcp_output
    mcp_output="$(codex mcp get ollama_codex 2>&1 || true)"
    if printf '%s\n' "$mcp_output" | grep -Fq "$root"; then
      ok "Codex MCP config points at this installed plugin root"
    elif [[ -n "$version" ]] && printf '%s\n' "$mcp_output" | grep -Fq "/ollama-codex/$version"; then
      ok "Codex MCP config points at the installed cache for this plugin version"
    else
      warn "Codex MCP config may not point at this plugin root"
      printf '%s\n' "$mcp_output" | sed -n '1,12p'
    fi
  else
    warn "codex executable: not found in PATH; skipped MCP config check"
  fi

  printf '\n'
  print_status
  printf '\n'
  info "If /ollama or MCP tool calls fail with 'Transport closed' in an already-open Codex thread, open a fresh Codex thread after installing or updating the plugin."
  info "Codex currently reloads plugin MCP handles per thread; reinstalling the plugin does not hot-swap stale handles inside an existing thread."
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
  doctor)
    require_no_args "$command_name" "$#"
    print_doctor
    ;;
  status)
    require_no_args "$command_name" "$#"
    print_status
    ;;
  setup|app-setup)
    require_no_args "$command_name" "$#"
    ensure_ollama || exit 1
    run_or_print ollama launch codex-app --yes
    ;;
  use-model|app-use-model)
    require_exact_args "$command_name" 1 "$#"
    ensure_ollama || exit 1
    run_or_print ollama launch codex-app --model "$1" --yes
    ;;
  app-use-codex-model)
    require_exact_args "$command_name" 1 "$#"
    ensure_codex || exit 1
    use_codex_openai_model "$1"
    ;;
  restore|app-restore)
    require_no_args "$command_name" "$#"
    ensure_ollama || exit 1
    run_or_print ollama launch codex-app --restore --yes
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
