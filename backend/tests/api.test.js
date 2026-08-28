"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../src/index"));
describe("CSPM API", () => {
    it("should return the deduped and scored report", async () => {
        const res = await (0, supertest_1.default)(index_1.default).get("/api/report");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("metrics");
        expect(res.body.metrics).toHaveProperty("raw");
        expect(res.body.metrics).toHaveProperty("deduped");
        expect(res.body.metrics).toHaveProperty("tickets");
        expect(res.body).toHaveProperty("tickets");
        expect(Array.isArray(res.body.tickets)).toBe(true);
    });
});
//# sourceMappingURL=api.test.js.map