# Romain-Ready Checklist

The goal is a repo someone working on Codex can inspect quickly and trust.

## Ready Signals

- The README first screen clearly frames the problem: Ollama already works with Codex, but most people do not know that and using it is tedious.
- The README states the product answer honestly: the easiest supported way to discover, enable, use, and restore Ollama workflows from Codex today.
- Public GitHub repo with a clear README and install path.
- Release tag and changelog.
- MIT license.
- GitHub Actions validation.
- One-command local validation through `bash scripts/validate.sh`.
- One-command demo through `bash scripts/demo.sh`.
- Visual UI boundary and future acceptance checklist in `docs/acceptance.md`.
- Codex plugin metadata includes starter prompts for readiness, App setup, App switching, CLI configuration, and restore.
- Slash commands cover installed-plugin diagnosis, Codex App, Codex CLI, model helpers, restore, and status.
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
- MCP probe rendered the widget template `ui://widget/ollama-codex-control-panel.html` as a source-level regression check, not live Codex visual proof.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh status` detected Ollama, Codex CLI, local models, and Codex App backup state.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config gpt-oss:20b` wrote `~/.codex/ollama-launch.config.toml` and `~/.codex/model.json` without launching Codex.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh cli-restore` removed the generated CLI profile/catalog.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh cli-run-model gpt-oss:20b` refused to launch from the non-interactive plugin shell, while `--dry-run` printed the exact terminal command.
- `codex plugin add ollama-codex@ollama-codex-local` installed the current plugin version into the local Codex plugin cache.
- `/ollama-codex-doctor` is backed by the wrapper's `doctor` command for MCP cache mismatch and stale-thread triage.
- Fresh-clone validation from GitHub passed.

## Product Boundary

- The current GUI is Codex's plugin GUI: plugin card, starter prompts, enable/disable, slash-command discovery, and command output.
- The plugin does not replace Codex's built-in OpenAI model selector.
- The experimental `/ollama` widget path is not accepted as a live Codex Mac app GUI unless Codex renders it visibly in a fresh thread.
- Codex has one active provider profile at a time; the plugin makes provider switching explicit rather than claiming Codex supports per-model providers in one native picker.
- Ollama configuration still runs through Ollama's official commands. Native Codex/OpenAI row switching uses Codex's documented `model` config key with a backup.
- No silent restore on plugin disablement. Restore remains explicit.
- No CI mutation of Codex App or Codex CLI profiles. CI uses validation and dry runs.

## Visual UI Roadmap

The visual model picker becomes Romain-ready only after Codex exposes or accepts a supported plugin-hosted visual surface for repo-local plugins. At that point, the acceptance proof should be a short screen recording of the visual UI opened from a fresh Codex thread, following `docs/acceptance.md`, showing current plugin version, setup/switch/restore actions, and one confirmed non-restarting action such as model listing.
