#!/usr/bin/env bash
set -uo pipefail

MIN_OLLAMA_VERSION="0.24.0"
OLLAMA_HOST_URL="${OLLAMA_HOST:-http://127.0.0.1:11434}"
DRY_RUN=false

usage() {
  cat <<'USAGE'
Usage:
  ollama-codex.sh [--dry-run] status
  ollama-codex.sh [--dry-run] setup
  ollama-codex.sh [--dry-run] use-model <model>
  ollama-codex.sh [--dry-run] restore

Commands:
  status             Check Ollama, Ollama server, Codex CLI, and minimum version.
  setup              Run: ollama launch codex-app
  use-model <model>  Run: ollama launch codex-app --model <model>
  restore            Run: ollama launch codex-app --restore

Options:
  --dry-run          Print the command that would run without changing Codex App.
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
    server_payload="$(curl -fsS --max-time 2 "$OLLAMA_HOST_URL/api/version" 2>/dev/null || true)"
    if [[ -n "$server_payload" ]]; then
      ok "ollama server: reachable at $OLLAMA_HOST_URL"
      info "server response: $server_payload"
    else
      warn "ollama server: not reachable at $OLLAMA_HOST_URL"
    fi
  else
    warn "ollama server: curl is not available, skipped reachability check"
  fi

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

run_or_print() {
  if [[ "$DRY_RUN" == "true" ]]; then
    printf '+'
    printf ' %q' "$@"
    printf '\n'
    return 0
  fi
  "$@"
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
    if [[ $# -ne 0 ]]; then
      error "status does not accept extra arguments."
      usage
      exit 2
    fi
    print_status
    ;;
  setup)
    if [[ $# -ne 0 ]]; then
      error "setup does not accept extra arguments."
      usage
      exit 2
    fi
    require_ollama || exit 1
    run_or_print ollama launch codex-app
    ;;
  use-model)
    if [[ $# -ne 1 ]]; then
      error "use-model requires exactly one model name."
      usage
      exit 2
    fi
    require_ollama || exit 1
    run_or_print ollama launch codex-app --model "$1"
    ;;
  restore)
    if [[ $# -ne 0 ]]; then
      error "restore does not accept extra arguments."
      usage
      exit 2
    fi
    require_ollama || exit 1
    run_or_print ollama launch codex-app --restore
    ;;
  *)
    error "unknown command: $command_name"
    usage
    exit 2
    ;;
esac
