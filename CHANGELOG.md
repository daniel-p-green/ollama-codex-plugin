# Changelog

## 0.5.3

- Let the widget fixture probe target either the source plugin or an installed Codex cache package with `PLUGIN_CWD`.

## 0.5.2

- Added a widget fixture probe that executes the real panel script with Codex-like tool data and verifies the visible active/configured model-picker states.
- Included the fixture probe in the normal validation path so picker regressions are caught before install.

## 0.5.1

- Tightened the model switcher UX with active/configured badges, disabled current-model switch buttons, and clearer OpenAI/Codex restore state.
- Refreshed App setup state after successful setup actions so the panel reflects the latest profile when Codex remains open.

## 0.5.0

- Replaced the localhost browser panel with an MCP app widget that renders directly inside Codex.
- Added a bundled MCP server with tools for rendering the panel, checking status, listing models, and running confirmed actions through the existing wrapper.
- Added side-by-side Codex profile and Ollama model state in the widget, using Codex config for the active model and Ollama's integration/recommendation files for App model choices.
- Treated Codex widget button clicks as explicit local-state actions while keeping direct MCP calls confirmation-gated, and surfaced widget tool errors in the panel output.
- Updated `/ollama-codex-panel`, docs, and validation to target the in-Codex visual surface.

## 0.4.0

- Added a localhost browser control panel spike for Ollama in Codex, served by the plugin and opened with `/ollama-codex-panel`. Superseded by the in-Codex MCP widget in 0.5.0.
- Added model listing, model pull, readiness checks, App setup/model/restore actions, and CLI config/restore actions to the panel.
- Updated the README and plugin card so “GUI” means the control panel, not only starter prompts and slash commands.

## 0.3.3

- Fixed Codex App setup, model switching, and restore so plugin commands pass Ollama's `--yes` confirmation flag and complete the intended restart/profile flow.
- Updated docs, dry-run output, and skill guidance to show the confirmed App commands.

## 0.3.2

- Hardened Codex CLI behavior after live testing showed `ollama launch codex --config --model <model>` can still launch an interactive Codex TUI after writing config.
- Changed `cli-config` to require a model and write the documented `ollama-launch` CLI profile/catalog without launching nested Codex.
- Added non-interactive guards for CLI launch commands and updated slash commands to hand off exact terminal commands safely.
- Updated validation, demo docs, and the Romain-ready checklist with the tested behavior.

## 0.3.1

- Reframed the README and plugin card around the core product point: the missing Codex plugin GUI for Ollama.
- Moved the GUI starter-prompt experience into the first screen of the README.
- Tightened share copy for a clearer public launch message.

## 0.3.0

- Added a Romain-ready sharing pass with README badges, a 30-second demo, proof links, and public-friendly positioning.
- Added demo and share docs so the project is easier to inspect quickly from GitHub.
- Added a demo script for repeatable local proof without mutating Codex profile state.

## 0.2.0

- Expanded the plugin from Codex App-only setup to the full official Ollama/Codex surface.
- Added Codex CLI commands for `ollama launch codex`, `--config`, `--restore`, `codex --oss`, model-specific CLI launches, and the `ollama-launch` profile.
- Added model helper commands for listing and pulling Ollama models.
- Improved status checks with model summary, profile/catalog detection, and backup detection.
- Added portable repo validation and GitHub Actions.
- Added production README coverage for App workflows, CLI workflows, restore boundaries, and validation.

## 0.1.0

- Initial repo-local Codex plugin for configuring Codex App with Ollama.
- Added Codex plugin metadata, starter prompts, slash commands, setup wrapper, reference docs, and Ollama logo assets.
