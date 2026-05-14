# AgentForge CLI — Coding Agent Rules

All coding agents (including Claude Code) must follow these rules when working in this repository.

## 1. Read this file first

Always read `AGENTS.md` before making changes.

## 2. Inspect project context before changing GoClaw-related behaviour

Before modifying anything related to GoClaw integration, read:
- `README.md`
- `package.json`
- `templates/CLI_MANUAL.md`
- Relevant files under `documents/`

## 3. GoClaw API integration must be documentation-driven

Before changing any GoClaw API integration behaviour:
- Check the most current available GoClaw documentation.
- The primary official LLM documentation source is `https://docs.goclaw.sh/llms-full.txt`.
- Prefer official documentation and the configured GoClaw instance OpenAPI endpoint (`<configured-api-url>/v1/openapi.json`) over assumptions from previous commits.
- If `documents/goclaw-llms-full.txt` is empty or stale, do not invent API behaviour.
- Use empirical API calls only after checking documentation and OpenAPI.
- Empirical calls are allowed for validation, but the validated behaviour must be documented and covered by tests when possible.

## 4. Local workspace layout is not the GoClaw API layout

The CLI intentionally exposes a user-friendly local workspace layout that is not identical to GoClaw's internal/API layout.

- Local agent memory may be stored under `agents/<slug>/memory/`.
- Local system skills may be stored under `skills/system/<slug>/`.
- GoClaw may expose or expect flatter paths, unified skill namespaces, tarball exports, import sections, or `context_files` paths.

This is not necessarily a GoClaw bug. Treat it as a local-to-remote representation mapping. Do not label behaviour as a GoClaw bug unless the current official documentation, the current OpenAPI contract, or a clearly reproducible server-side failure confirms that it is invalid behaviour.

## 5. Regression safety for mapping and sync logic

Any change to path flattening, unflattening, memory reconstruction, skill export/import, system skill placement, `context_files`, pull, deploy, or pruning must include regression tests.

## 6. Security and repository hygiene

- Do not commit secrets, tokens, API keys, local GoClaw URLs with credentials, `.env` files, or real user data.
- Keep PRs small and focused.
- Run `npm run verify` before marking a PR ready.
- Do not change CI/CD publishing behaviour unless the PR is specifically about release engineering.
