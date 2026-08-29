# Changelog — cspm-noise-reduction-agent

## [2026-08-29] — Phase 0 fixes (Portfolio Action Plan)
### Fixed
- `backend/src/index.ts`: Added `isTest` guard that bypasses MCP subprocess (`npx ts-node`) when `NODE_ENV=test` or `JEST_WORKER_ID` is set. The handler now calls `loadFindings → deduplicate → scoreFindings` directly in test mode, making tests self-contained.
- `backend/src/index.ts`: Fixed `scoreFindings` call — function takes 1 argument (not 2). Removed erroneous `useLlm` parameter. Fixed `actionable_tickets_count` filter from `score >= 70` to `exploitabilityScore >= 7.0` (0–10 scale).
- `backend/jest.config.js`: Added `testEnvironmentOptions: { NODE_ENV: 'test' }` and `ts-jest` tsconfig `esModuleInterop: true`.
### Added
- `docs/architecture.md`: Expanded from 22-line placeholder to full Mermaid flowchart (production + test paths), component table, scoring logic, port assignments, dependency honesty table.
- `docs/runbook.md`: New — quick start for backend and dashboard, test commands with expected output, MCP server mode docs, failure modes, scoring pipeline walkthrough.
- `docs/decisions.md`: New — four ADRs covering scoring strategy, dedup key, MCP integration, `isTest` guard.
- `docs/changelog.md`: New (this file).

## [Pre-2026-08-29] — Initial implementation
### Added
- Deduplication engine (`dedup/engine.ts`) — CVE + package + resource key
- Contextual scorer (`scoring/scorer.ts`) — CVSS + internet-facing/exploit/runtime modifiers
- MCP server tool (`mcp-tool/`) — `get_prioritized_findings` via stdio
- Express API (`src/index.ts`) — `GET /api/report`
- React dashboard (`dashboard/`) — noise reduction visualization
- Mock data generator (`scripts/generate_mock_data.js`) — 150+ realistic findings
- Jest test suite (1 test)
- GitHub Actions CI pipeline
