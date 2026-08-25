import express from 'express';
import cors from 'cors';
import { loadFindings } from './ingestion/parser';
import { deduplicate } from './dedup/engine';
import { scoreFindings, summarizeWithLLM } from './scoring/scorer';
import { runMcpServer } from './mcp-tool';

const app = express();
app.use(cors());

app.get('/api/report', async (req, res) => {
  try {
    const rawFindings = loadFindings();
    const deduped = deduplicate(rawFindings);
    const scored = scoreFindings(deduped);
    const topTickets = scored.slice(0, 12); // Reduce to top 12 as per prompt
    
    // For the web UI, we use the deterministic/mock LLM output
    const finalTickets = await summarizeWithLLM(topTickets, 'mock-key');

    res.json({
      metrics: {
        raw: rawFindings.length,
        deduped: deduped.length,
        tickets: finalTickets.length,
      },
      tickets: finalTickets
    });
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
