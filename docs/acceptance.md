# Visual UI Boundary And Acceptance

Use this checklist to keep the current product boundary honest.

## Current Decision

Ollama for Codex is accepted as a Codex command/control plugin today. It is not accepted as a native visual widget inside the Codex Mac app today.

The plugin can install, validate, expose starter prompts, route slash commands, run MCP tools, call the deterministic wrapper, and delegate supported App setup/switch/restore work to Ollama's official commands. The experimental `/ollama` widget path may return JSON or structured tool output in Codex. That means the current Codex host is not mounting this repo-local widget surface; it is not a user setup failure.

## Current Package Checks

Run these from the repo:

```bash
./scripts/acceptance-preflight.sh
```

Or run the checks manually:

```bash
bash scripts/validate.sh
codex plugin add ollama-codex@ollama-codex-local
codex mcp get ollama_codex
```

Expected evidence:

- Validation passes.
- The installed plugin version is current.
- The installed slash commands exist in the plugin cache.
- `codex mcp get ollama_codex` points at the current installed plugin cache, not an older cache path.
- The MCP probe and widget fixture probe pass as source-level regression checks.

## Current Live Codex Check

Open a fresh Codex thread after installing or updating the plugin.

Run:

```text
/ollama-codex-doctor
/ollama-codex-status
```

Expected evidence:

- Doctor reports the current installed plugin root.
- Status reports Ollama install/version readiness, Ollama server reachability, Codex CLI status, and profile/catalog state.
- No stale deleted cache path appears.
- No stale `Transport closed` error appears.

You may also run the experimental widget route:

```text
/ollama
```

If Codex shows JSON, structured tool output, or a plain text result instead of a widget card, the visual GUI has not passed acceptance in that Codex build/session. Treat the command layer as working and the host visual surface as unavailable.

## What Does Not Count As Visual UI Proof

- A standalone HTML fixture or localhost page.
- A green MCP source probe alone.
- A rendered widget template outside the live Codex Mac app host.
- JSON or structured tool output from `/ollama`.
- An already-open thread after reinstall if it still has tool handles from a previous plugin cache.

## Future Visual UI Acceptance

Only call the plugin visually functional when both are true:

- Package checks pass against the current installed cache.
- A fresh Codex Mac app thread renders `/ollama` or its future replacement as a visible native model/control UI, and one non-restarting action such as status or model listing succeeds inside that UI.

Until then, describe `/ollama` as an experimental visual UI probe and describe the shipping plugin as a command/control plugin.
