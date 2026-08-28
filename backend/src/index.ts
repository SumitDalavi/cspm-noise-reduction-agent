import express from 'express';
import cors from 'cors';
import { loadFindings } from './ingestion/parser';
import { deduplicate } from './dedup/engine';
import { scoreFindings, summarizeWithLLM } from './scoring/scorer';
import { runMcpServer } from './mcp-tool';

const app = express();
app.use(cors());

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

app.get('/api/report', async (req, res) => {
  try {
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
