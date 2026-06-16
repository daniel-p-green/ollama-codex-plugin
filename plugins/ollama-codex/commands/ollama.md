---
description: Try the experimental Ollama visual UI probe for Codex
allowed-tools: ["mcp__ollama_codex__render_ollama_codex_panel", "Bash(bash:*)"]
---

Try the experimental Ollama for Codex widget probe:

Use the `render_ollama_codex_panel` tool from the `ollama_codex` MCP server. In Codex tool notation this is expected to appear as `mcp__ollama_codex__render_ollama_codex_panel`.

If the MCP tool is unavailable or fails with `Transport closed`, run the bundled Doctor fallback:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh doctor
```

Then report that Codex needs a fresh thread after installing or updating the plugin before MCP tools can reload.

This is the short alias for `/ollama-codex-panel`. It is retained for future Codex host support and diagnostics. If Codex returns JSON, structured tool output, or a plain text result instead of a visible widget, report that the supported command layer is still working but the native visual UI is not available in the current Codex build/session.
