# GoClaw Implementation Notes

## How to use this file

- All notes must be evidence-based and dated when possible.
- Do not invent API behaviour here.
- When official documentation, OpenAPI, and empirical behaviour disagree, record the discrepancy in this file or in the PR description, and add tests for the behaviour that AgentForge must support.

## Notes

### 2026-05-14 — Refresh of docs.goclaw.sh/llms-full.txt

- Attempted to fetch `https://docs.goclaw.sh/llms-full.txt` during PR work.
- The fetch appeared to return content in preview, but the persisted snapshot could not be saved to `documents/goclaw-llms-full.txt`.
- The existing local snapshot was preserved and left in place.
- Next refresh attempt should verify the saved file size matches the expected content length.
