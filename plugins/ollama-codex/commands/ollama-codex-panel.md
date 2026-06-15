---
description: Open the Ollama for Codex visual control panel
allowed-tools: ["mcp__ollama_codex__render_ollama_codex_panel"]
---

Render the in-Codex Ollama control panel:

Use the `render_ollama_codex_panel` tool from the `ollama_codex` MCP server. In Codex tool notation this is expected to appear as `mcp__ollama_codex__render_ollama_codex_panel`.

The panel renders inside Codex. It shows the active Codex/OpenAI profile beside Ollama's recommended and local model choices, checks readiness, lists local models, pulls models, configures Codex CLI, restores Codex CLI, sets up Codex App, switches Codex App models, and restores Codex App. App actions may restart Codex, so the panel treats direct button clicks as explicit user actions while direct non-dry-run MCP calls remain confirmation-gated.
