import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import Repository from "../src/repositories/leader-meeting-rating.repository.js";
import router from "../src/routes/leader-meeting-rating.route.js";
import Swagger from "../src/swagger/leader-meeting-rating.swagger.js";

const originals = {
  find: Repository.findRegistrationByCode,
  create: Repository.create,
  audit: prisma.audit_logs.create,
};
const eligible = {
  id: "423e4567-e89b-42d3-a456-426614174004",
  ma_dang_ky: "LD000126",
  trang_thai: "COMPLETED",
  danh_gia_gap_lanh_dao: null,
};
const validBody = {
  registrationCode: "LD000126",
  score: 5,
  selectedSuggestions: ["Lãnh đạo rất tận tình và chuyên nghiệp"],
  comment: "Tôi rất hài lòng",
};
const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/leader-meeting-ratings", router);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  Repository.findRegistrationByCode = async () => eligible;
  Repository.create = async (data) => ({
    id: "723e4567-e89b-42d3-a456-426614174001",
    ...data,
    thoi_gian_tao: new Date(),
  });
  prisma.audit_logs.create = async () => ({ id: "audit" });
});
afterEach(() => {
  Repository.findRegistrationByCode = originals.find;
  Repository.create = originals.create;
  prisma.audit_logs.create = originals.audit;
});

describe("POST /api/leader-meeting-ratings", () => {
  it("documents COMPLETED, duplicate guard, comment limit and rate limit", () => {
    const operation = Swagger["/api/leader-meeting-ratings"].post;
    assert.match(operation.description, /COMPLETED/);
    assert.match(operation.description, /2000/);
    assert.match(operation.description, /20 yêu cầu/);
    assert.ok(operation.responses[409]);
    assert.ok(operation.responses[429]);
  });

  it("submits a valid rating for a completed leader meeting", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/leader-meeting-ratings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data.registrationCode, "LD000126");
      assert.equal(body.data.score, 5);
      assert.deepEqual(body.data.selectedSuggestions, validBody.selectedSuggestions);
    } finally {
      server.close();
    }
  });

  it("returns 400 for missing data or a suggestion from another score", async () => {
    const server = createServer();
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/leader-meeting-ratings`;
    try {
      const missing = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const invalidSuggestion = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...validBody,
          selectedSuggestions: ["Lãnh đạo giao tiếp lịch sự"],
        }),
      });
      assert.equal(missing.status, 400);
      assert.equal(invalidSuggestion.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 404 for an unknown code and 409 before completion", async () => {
    const server = createServer();
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/leader-meeting-ratings`;
    try {
      Repository.findRegistrationByCode = async () => null;
      const missing = await fetch(url, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(validBody),
      });
      Repository.findRegistrationByCode = async () => ({ ...eligible, trang_thai: "IN_PROGRESS" });
      const notCompleted = await fetch(url, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(validBody),
      });
      assert.equal(missing.status, 404);
      assert.equal(notCompleted.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 409 for an existing or concurrent duplicate rating", async () => {
    const server = createServer();
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/leader-meeting-ratings`;
    try {
      Repository.findRegistrationByCode = async () => ({
        ...eligible,
        danh_gia_gap_lanh_dao: { id: "existing" },
      });
      const existing = await fetch(url, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(validBody),
      });
      Repository.findRegistrationByCode = async () => eligible;
      Repository.create = async () => { const error = new Error("unique"); error.code = "P2002"; throw error; };
      const concurrent = await fetch(url, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(validBody),
      });
      assert.equal(existing.status, 409);
      assert.equal(concurrent.status, 409);
    } finally {
      server.close();
    }
  });
});
