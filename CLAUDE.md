@AGENTS.md

# Claude Code Project Instructions

These instructions extend AGENTS.md for Claude Code.

## Required workflow

- Read AGENTS.md first through the import above.
- Keep PRs small and scoped.
- Do not push directly to main.
- Do not merge PRs unless explicitly instructed.
- Do not publish manually to npm.
- Always run npm run verify before marking work complete.
- Always run npm pack --dry-run when package contents may be affected.
- Use GitHub CLI when creating PRs, updating PRs, and checking CI.
- Never print or commit tokens, credentials, local GoClaw URLs with credentials, .env files, agentforge.json, agentforge.yml, or local OpenAPI snapshots.

## GoClaw integration

- Before changing GoClaw behaviour, read documents/goclaw-sources.md and documents/goclaw-notes.md.
- Prefer official GoClaw documentation and the configured instance OpenAPI over guesses.
- Do not describe behaviour as a GoClaw bug unless documentation, OpenAPI, or a reproducible server-side failure confirms it.
- Any change to path mapping, memory, context_files, skills import/export, deploy, pull, or pruning must include regression tests.
