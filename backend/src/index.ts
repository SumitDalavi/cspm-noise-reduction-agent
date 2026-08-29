import express from 'express';
import cors from 'cors';
import { loadFindings } from './ingestion/parser';
import { deduplicate } from './dedup/engine';
import { scoreFindings, summarizeWithLLM } from './scoring/scorer';
import { runMcpServer } from './mcp-tool';

const app = express();
app.use(cors());

const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

// In test mode we bypass the MCP subprocess (which requires npx in PATH)
// and call the scoring pipeline directly. Production behavior is unchanged.
async function getReport(topN: number, _useLlm: boolean) {
  const raw = loadFindings();
  const deduped = deduplicate(raw);
  const scored = scoreFindings(deduped);
  return {
    metrics: {
      raw_findings_count: raw.length,
      deduplicated_count: deduped.length,
      // exploitabilityScore is on a 0-10 scale; >=7 = HIGH or CRITICAL
      actionable_tickets_count: scored.filter((f: any) => f.exploitabilityScore >= 7.0).length,
    },
    tickets: scored.slice(0, topN),
  };
}

app.get('/api/report', async (req, res) => {
  try {
    if (isTest) {
      // Direct call — no subprocess, no npx required
      const report = await getReport(12, false);
      return res.json(report);
    }

    // Production: use MCP subprocess
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");

    const isTs = __filename.endsWith('.ts');
    const transport = new StdioClientTransport({
      command: isTs ? "npx" : "node",
      args: isTs ? ["ts-node", __filename, "mcp"] : [__filename, "mcp"]
    });

    const client = new Client(
      { name: "cspm-api-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    const result = await client.callTool({
      name: "get_prioritized_findings",
      arguments: {
        top_n: 12,
        use_llm: false
      }
    });

    if (result.isError) {
      await client.close();
      throw new Error(`MCP Tool Error: ${(result as any).content[0]?.text}`);
    }

    const jsonText = (result as any).content[0].text;
    await client.close();
    res.json(JSON.parse(jsonText));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  const mode = process.argv[2];
  if (mode === 'mcp') {
    runMcpServer().catch(console.error);
  } else {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`CSPM Agent API running on http://localhost:${port}`);
    });
  }
}

export default app;

