# Runbook — cspm-noise-reduction-agent
> Last updated: 2026-08-29

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| TypeScript | 5+ | Installed via `npm install` |

## Quick Start — Backend API

```bash
cd backend
npm install
npx ts-node src/index.ts
# API available at http://localhost:3000
```

Verify:
```bash
curl http://localhost:3000/api/report
# Returns: { "metrics": { "raw_findings_count": N, ... }, "tickets": [...] }
```

## Quick Start — Frontend Dashboard

```bash
cd dashboard
npm install
npm run dev
# Dashboard at http://localhost:5173
```

## Run Tests

```bash
cd backend
npm test
```

Expected output:
```
PASS tests/api.test.ts
  CSPM API
    ✓ should return the deduped and scored report (34 ms)

Tests: 1 passed, 1 total
```

> **Note:** Tests bypass the MCP subprocess via `isTest` guard. `NODE_ENV=test` or `JEST_WORKER_ID` triggers direct pipeline execution.

## Generate Mock Data

```bash
cd backend
node ../scripts/generate_mock_data.js
# Writes data/mock_findings.json with 150+ synthetic findings
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | unset | Set to `test` to bypass MCP subprocess in API handler |
| `PORT` | 3000 | Backend API port |
| `OPENAI_API_KEY` | unset | Optional — enables real LLM summaries in `summarizeWithLLM()` |

## MCP Server Mode

Run the backend as an MCP server (for Claude / AI agent integration):

```bash
cd backend
npx ts-node src/index.ts mcp
# Starts stdio MCP server — connect via Claude Desktop or MCP client
```

Available tools:
- `get_prioritized_findings(top_n: number, use_llm: boolean)` → returns deduplicated, scored ticket list

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| `npx: command not found` in test output | Old Node/npm version | Upgrade to Node 18+ |
| Test fails with `Expected 1 arguments, but got 2` | `scoreFindings` called with `useLlm` arg (fixed 2026-08-29) | Pull latest code |
| `GET /api/report` returns 500 | MCP subprocess spawn failure | Set `NODE_ENV=test` or use `npx ts-node src/index.ts` directly |
| Dashboard shows blank | Backend not running or CORS mismatch | Start backend first on `:3000`, then dashboard on `:5173` |

## Scoring Pipeline Explained

1. `loadFindings()` — reads `data/mock_findings.json` (150+ raw alerts)
2. `deduplicate()` — collapses by `CVE + package + resource` (150 → ~12 unique issues)
3. `scoreFindings()` — adjusts base CVSS with context modifiers, sorts by score
4. API returns `{ metrics, tickets }` — `metrics.actionable_tickets_count` = findings with score ≥ 7.0
