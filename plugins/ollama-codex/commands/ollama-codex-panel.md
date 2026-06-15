---
description: Open the Ollama for Codex visual control panel
allowed-tools: ["mcp__ollama_codex__render_ollama_codex_panel"]
---

Render the in-Codex Ollama control panel:

Use the `render_ollama_codex_panel` tool from the `ollama_codex` MCP server. In Codex tool notation this is expected to appear as `mcp__ollama_codex__render_ollama_codex_panel`.

The panel renders inside Codex. It can check readiness, list local models, pull models, configure Codex CLI, restore Codex CLI, set up Codex App, switch Codex App models, and restore Codex App. App actions may restart Codex, so the panel treats direct button clicks as explicit user actions while direct non-dry-run MCP calls remain confirmation-gated.
