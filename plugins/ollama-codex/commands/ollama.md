---
description: Open the Ollama model picker for Codex
allowed-tools: ["mcp__ollama_codex__render_ollama_codex_panel", "Bash(bash:*)"]
---

Render the Ollama for Codex model picker:

Use the `render_ollama_codex_panel` tool from the `ollama_codex` MCP server. In Codex tool notation this is expected to appear as `mcp__ollama_codex__render_ollama_codex_panel`.

If the MCP tool is unavailable or fails with `Transport closed`, run the bundled Doctor fallback:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh doctor
```

Then report that Codex needs a fresh thread after installing or updating the plugin before the visual widget can render.

This is the short alias for `/ollama-codex-panel`. It opens the in-Codex visual picker for Codex/OpenAI and Ollama models.
