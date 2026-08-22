import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import {
  createReceptionRatingSubmissionRateLimiter,
  RECEPTION_RATING_SUBMISSION_RATE_LIMIT,
} from "../src/middlewares/reception-rating-rate-limit.middleware.js";
import ReceptionRatingRepository from "../src/repositories/reception-rating.repository.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";
import ReceptionRatingSwagger from "../src/swagger/reception-rating.swagger.js";

const originalMethods = {
  findByReceptionCode: ReceptionRatingRepository.findByReceptionCode,
  create: ReceptionRatingRepository.create,
  auditCreate: prisma.audit_logs.create,
};

const validBody = {
  receptionCode: "TD-20260822-001",
  citizenName: "Nguyễn Văn An",
  officerName: "Trần Thị Bình",
  counterCode: "QUAY_2",
  receptionDate: "2026-08-22",
  timeSlot: "08:30 - 09:30",
  workingContent: "Hướng dẫn thủ tục hành chính",
  score: 5,
  comment: "Cán bộ hướng dẫn rõ ràng và dễ hiểu.",
};

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-ratings", receptionRatingRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  ReceptionRatingRepository.findByReceptionCode = async () => null;
  ReceptionRatingRepository.create = async (data) => ({
    id: "223e4567-e89b-42d3-a456-426614174000",
    ...data,
    thoi_gian_tao: new Date("2026-08-22T02:30:00.000Z"),
  });
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  ReceptionRatingRepository.findByReceptionCode =
    originalMethods.findByReceptionCode;
  ReceptionRatingRepository.create = originalMethods.create;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("POST /api/reception-ratings", () => {
  it("documents the complete manual iPad contract", () => {
    const operation = ReceptionRatingSwagger["/api/reception-ratings"].post;
    const requestSchema =
      operation.requestBody.content["application/json"].schema;

    assert.equal(operation.security, undefined);
    assert.ok(operation.description.includes("không đối chiếu"));
    assert.ok(requestSchema.required.includes("officerName"));
    assert.ok(requestSchema.required.includes("workingContent"));
    assert.equal(requestSchema.required.includes("selectedSuggestions"), false);
    assert.equal(requestSchema.properties.selectedSuggestions, undefined);
    assert.equal(operation.responses[404], undefined);
    assert.ok(operation.responses[409].description.includes("Mã tiếp dân"));
    assert.ok(operation.responses[429]);
  });

  it("submits all manually entered fields without a registration lookup", async () => {
    let createdData;
    ReceptionRatingRepository.create = async (data) => {
      createdData = data;
      return {
        id: "223e4567-e89b-42d3-a456-426614174000",
        ...data,
        thoi_gian_tao: new Date("2026-08-22T02:30:00.000Z"),
      };
    };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.receptionCode, validBody.receptionCode);
      assert.equal(body.data.citizenName, validBody.citizenName);
      assert.equal(body.data.officerName, validBody.officerName);
      assert.equal(body.data.counterCode, validBody.counterCode);
      assert.equal(body.data.receptionDate, validBody.receptionDate);
      assert.equal(createdData.id_dang_ky_tiep_dan, null);
      assert.equal(createdData.nguoi_tao, null);
      assert.equal(createdData.ly_do, null);
    } finally {
      server.close();
    }
  });

  for (const field of Object.keys(validBody)) {
    it(`rejects a request missing required field ${field}`, async () => {
      const bodyWithoutField = { ...validBody };
      delete bodyWithoutField[field];
      const server = createTestServer();
      const { port } = server.address();
      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/api/reception-ratings`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(bodyWithoutField),
          }
        );
        assert.equal(response.status, 400);
      } finally {
        server.close();
      }
    });
  }

  it("rejects an existing manual reception code", async () => {
    ReceptionRatingRepository.findByReceptionCode = async () => ({
      id: "existing-rating",
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("maps a concurrent unique conflict to 409", async () => {
    ReceptionRatingRepository.create = async () => {
      const error = new Error("Unique constraint failed");
      error.code = "P2002";
      throw error;
    };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  for (const invalidData of [
    { counterCode: "QUAY_9" },
    { receptionDate: "2026-02-30" },
    { timeSlot: "09:30 - 08:30" },
    { timeSlot: "8:30-9:30" },
  ]) {
    it(`rejects invalid manual data ${JSON.stringify(invalidData)}`, async () => {
      const server = createTestServer();
      const { port } = server.address();
      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/api/reception-ratings`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...validBody, ...invalidData }),
          }
        );
        assert.equal(response.status, 400);
      } finally {
        server.close();
      }
    });
  }

  it("limits rating submissions to 20 requests per 10 minutes per IP", async () => {
    const app = express();
    app.use(express.json());
    app.use(createReceptionRatingSubmissionRateLimiter());
    app.post("/ratings", (_req, res) => res.json({ success: true }));
    const server = app.listen(0);
    const { port } = server.address();
    try {
      for (
        let index = 0;
        index < RECEPTION_RATING_SUBMISSION_RATE_LIMIT.limit;
        index += 1
      ) {
        const response = await fetch(`http://127.0.0.1:${port}/ratings`, {
          method: "POST",
        });
        assert.equal(response.status, 200);
      }
      const blockedResponse = await fetch(
        `http://127.0.0.1:${port}/ratings`,
        { method: "POST" }
      );
      assert.equal(blockedResponse.status, 429);
    } finally {
      server.close();
    }
  });
});
