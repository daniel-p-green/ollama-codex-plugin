# Fresh-Thread Acceptance

Use this checklist when proving that Ollama for Codex works as a visual plugin in the Codex Mac app. It separates package validation from the live Codex UI proof.

## Package Checks

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
- The installed `/ollama` command exists in the plugin cache.
- The installed `/ollama-codex-doctor` command exists in the plugin cache.
- `codex mcp get ollama_codex` points at the current installed plugin cache, not an older cache path.
- The installed-cache MCP and widget fixture probes pass.

## Live Codex App Check

Open a fresh Codex thread after installing or updating the plugin.

In the new thread, run:

```text
/ollama
```

Expected visual evidence:

- A widget renders directly in the Codex conversation, not in a separate localhost page.
- The panel header shows the installed plugin version.
- The model summary includes `native Codex switching enabled`.
- The panel shows `Choose Model`.
- The search box says `Search Codex or Ollama models`.
- Codex/OpenAI rows and Ollama rows are visible in the same picker.
- The panel states that Codex/OpenAI and Ollama models are visible together while Codex has one active provider profile at a time.
- Native Codex/OpenAI rows expose `Switch` controls.
- Ollama rows expose `Switch` controls.
- App setup, App restore, CLI config, CLI restore, model listing, and model pull actions are visible.
- Command results stay hidden until an action runs.

If Codex shows JSON, structured tool output, or a plain text result instead of a widget card, the visual GUI has not passed acceptance in that Codex build/session. That is true even if the MCP tool call succeeds. Treat the package as installed but the host visual surface as unproven or unavailable.

Then run one non-restarting action from the panel, such as model listing or refresh.

Expected action evidence:

- The action result appears in the panel.
- The result is based on the current installed plugin version.
- No stale `Transport closed` error appears.
- No path from an older deleted plugin cache appears.

If `Transport closed` appears in an already-open thread, run:

```text
/ollama-codex-doctor
```

If the doctor reports that the installed plugin root and `codex mcp get ollama_codex` are current, the issue is stale thread-local MCP handles. Open a fresh Codex thread and rerun `/ollama`.

## What Does Not Count

- A standalone HTML fixture or localhost page is not enough to prove the Codex Mac app GUI.
- A green source probe alone is not enough to prove the current Codex thread loaded the fresh MCP server.
- An already-open thread after reinstall is not enough if it still has tool handles from a previous plugin cache.
- The plugin does not replace Codex's native top model dropdown. The supported visual surface is the in-chat Codex plugin widget.

## Pass Criteria

The plugin is ready to call visually functional only when both are true:

- Package checks pass against the current installed cache.
- A fresh Codex thread renders `/ollama` as the in-chat visual model picker and one non-restarting panel action succeeds.
