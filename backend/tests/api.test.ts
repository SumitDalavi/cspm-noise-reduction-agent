import request from "supertest";
import app from "../src/index";

describe("CSPM API", () => {
  it("should return the deduped and scored report", async () => {
    const res = await request(app).get("/api/report");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body.metrics).toHaveProperty("raw_findings_count");
    expect(res.body.metrics).toHaveProperty("deduplicated_count");
    expect(res.body.metrics).toHaveProperty("actionable_tickets_count");
    expect(res.body).toHaveProperty("tickets");
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });
});
