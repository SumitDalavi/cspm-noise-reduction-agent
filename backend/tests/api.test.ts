import request from "supertest";
import app from "../src/index";

describe("CSPM API", () => {
  it("should return the deduped and scored report", async () => {
    const res = await request(app).get("/api/report");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body.metrics).toHaveProperty("raw");
    expect(res.body.metrics).toHaveProperty("deduped");
    expect(res.body.metrics).toHaveProperty("tickets");
    expect(res.body).toHaveProperty("tickets");
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });
});
