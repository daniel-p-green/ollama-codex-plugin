# Romain-Ready Checklist

The goal is a repo someone working on Codex can inspect quickly and trust.

## Ready Signals

- The README first screen clearly frames the problem: Ollama already works with Codex, but most people do not know that and using it is tedious.
- The README states the product answer: the easiest visual way to see Codex/OpenAI and Ollama model options available together, enable Ollama, use Ollama models, and safely switch back inside the Codex Mac app, within the plugin surface Codex exposes today.
- Public GitHub repo with a clear README and install path.
- Release tag and changelog.
- MIT license.
- GitHub Actions validation.
- One-command local validation through `bash scripts/validate.sh`.
- One-command demo through `bash scripts/demo.sh`.
- Codex plugin metadata includes an "Open the Ollama model switcher" starter prompt.
- `/ollama-codex-panel` renders a real MCP-powered visual control panel inside the Codex Mac app chat.
- Fresh panel renders show the installed plugin version and the phrase `native Codex switching enabled`, which distinguishes the current package from stale already-loaded MCP processes.
- The panel shows readiness, the visible Codex/OpenAI model catalog, the active Codex model, the Ollama App model, recommended Ollama Codex models, deduplicated local models, model filtering, counts, active/configured/installed badges, direct model `Switch` controls, App actions, CLI actions, and restore actions.
- Model row `Switch` controls switch Codex App to the chosen Ollama model or back to a native Codex/OpenAI model; native model switching writes a timestamped Codex config backup first.
- Slash commands cover Codex App, Codex CLI, model helpers, restore, and status.
- Wrapper supports `--dry-run` so command routing can be verified without mutating profiles.
- CLI config writes the documented `ollama-launch` profile/catalog without launching nested Codex.
- Interactive CLI launch commands are guarded in non-interactive Codex shells and provide terminal handoff commands.
- Restore boundaries are explicit: App restore and CLI restore are separate.
- Docs are grounded in current Ollama Codex App, Codex CLI, and CLI Reference pages.

## Verified Locally

Latest local checks performed during the Romain-ready pass:

- `bash scripts/validate.sh` passed.
- `bash scripts/demo.sh` passed.
- `node --check plugins/ollama-codex/mcp/server.mjs` passed.
- MCP probe listed `render_ollama_codex_panel`, `ollama_codex_status`, `ollama_codex_models`, and `ollama_codex_action`.
- MCP probe rendered the widget template `ui://widget/ollama-codex-control-panel.html`.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh status` detected Ollama, Codex CLI, local models, and Codex App backup state.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config gpt-oss:20b` wrote `~/.codex/ollama-launch.config.toml` and `~/.codex/model.json` without launching Codex.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh cli-restore` removed the generated CLI profile/catalog.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh cli-run-model gpt-oss:20b` refused to launch from the non-interactive plugin shell, while `--dry-run` printed the exact terminal command.
- `codex plugin add ollama-codex@ollama-codex-local` installed the current plugin version into the local Codex plugin cache.
- Fresh-clone validation from GitHub passed.

## Product Boundary

- The GUI is an MCP app widget rendered inside the Codex Mac app, not a separate browser page.
- The plugin does not replace Codex's built-in OpenAI model selector; current plugin metadata exposes cards, starter prompts, skills, commands, MCP servers, and in-chat app widgets.
- The closest supported model-selector experience is the in-chat widget's side-by-side Codex/OpenAI catalog rows plus recommended/local Ollama model rows.
- Codex has one active provider profile at a time; the plugin makes both catalogs visible together and switching providers visual rather than claiming Codex supports per-model providers in one native picker.
- Ollama configuration still runs through Ollama's official commands. Native Codex/OpenAI row switching uses Codex's documented `model` config key with a backup.
- No silent restore on plugin disablement. Restore remains explicit.
- No CI mutation of Codex App or Codex CLI profiles. CI uses validation and dry runs.

## Remaining Manual Check

The remaining manual proof is a short screen recording of the panel opened from a fresh Codex thread, showing the installed plugin version, `native Codex switching enabled`, dry-run App/CLI actions, and one confirmed non-restarting action such as model listing.
