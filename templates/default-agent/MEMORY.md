# MEMORY.md - Long-Term Memory

## Key Decisions

- Chose Anthropic Claude as primary LLM (Nov 2025) — best instruction-following, good context window
- Switched to pgvector for embeddings (Jan 2026) — faster than external service

## Learnings

- Users want agent personality to be customizable per-user (not fixed)
- Memory search is most-used tool — index aggressively
- WebSocket connections drop on long operations — need heartbeats

## Important Contacts

- Engineering lead: @alex, alex@company.com
- Product: @jordan
- Legal: @sam (always approves new features)

## Active Projects

- Building open agent architecture (target: March 2026)
- Memory compaction for large MEMORY.md files